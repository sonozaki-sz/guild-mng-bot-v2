import type { Mock } from "vitest";
import {
  findTriggerChannelByCategory,
  resolveTargetCategory,
} from "@/bot/features/vac/commands/helpers/vacConfigTargetResolver";
import { handleVacConfigRemoveTrigger } from "@/bot/features/vac/commands/usecases/vacConfigRemoveTrigger";
import { getBotVacRepository } from "@/bot/services/botVacDependencyResolver";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";
import { ValidationError } from "@/shared/errors/customErrors";
import { ChannelType, MessageFlags } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
  tGuild: vi.fn(async (_guildId: string, key: string) => key),
}));

vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: vi.fn(),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: vi.fn((description: string) => ({ description })),
}));

vi.mock(
  "@/bot/features/vac/commands/helpers/vacConfigTargetResolver",
  () => ({
    resolveTargetCategory: vi.fn(),
    findTriggerChannelByCategory: vi.fn(),
  }),
);

describe("bot/features/vac/commands/usecases/vacConfigRemoveTrigger", () => {
  // remove-trigger-vc のガード分岐と削除フローを検証する
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveTargetCategory as Mock).mockResolvedValue(null);
  });

  it("throws ValidationError when guild context is missing", async () => {
    const interaction = {
      guild: null,
      channelId: "ch-1",
      options: { getString: vi.fn() },
      reply: vi.fn(),
    };

    await expect(
      handleVacConfigRemoveTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when trigger channel is not found", async () => {
    (getBotVacRepository as Mock).mockReturnValue({
      getVacConfigOrDefault: vi
        .fn()
        .mockResolvedValue({ triggerChannelIds: [] }),
      removeTriggerChannel: vi.fn(),
    });
    (findTriggerChannelByCategory as Mock).mockResolvedValue(null);

    const interaction = {
      guild: { channels: { fetch: vi.fn() } },
      channelId: "ch-1",
      options: { getString: vi.fn(() => "cat-1") },
      reply: vi.fn(),
    };

    await expect(
      handleVacConfigRemoveTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("removes trigger from config, deletes channel, and replies ephemeral", async () => {
    const removeTriggerChannel = vi.fn().mockResolvedValue(undefined);
    (getBotVacRepository as Mock).mockReturnValue({
      getVacConfigOrDefault: vi.fn().mockResolvedValue({
        triggerChannelIds: ["trigger-1"],
      }),
      removeTriggerChannel,
    });
    (findTriggerChannelByCategory as Mock).mockResolvedValue({
      id: "trigger-1",
      name: "CreateVC",
    });

    const deleteMock = vi.fn().mockResolvedValue(undefined);
    const fetch = vi.fn().mockResolvedValue({
      id: "trigger-1",
      type: ChannelType.GuildVoice,
      delete: deleteMock,
    });
    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guild: { channels: { fetch } },
      channelId: "ch-1",
      options: { getString: vi.fn(() => "cat-1") },
      reply,
    };

    await handleVacConfigRemoveTrigger(interaction as never, "guild-1");

    expect(removeTriggerChannel).toHaveBeenCalledWith("guild-1", "trigger-1");
    expect(fetch).toHaveBeenCalledWith("trigger-1");
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(createSuccessEmbed).toHaveBeenCalledWith(
      "commands:vac-config.embed.trigger_removed",
    );
    expect(reply).toHaveBeenCalledWith({
      embeds: [{ description: "commands:vac-config.embed.trigger_removed" }],
      flags: MessageFlags.Ephemeral,
    });
  });
});
