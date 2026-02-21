import {
  findTriggerChannelByCategory,
  resolveTargetCategory,
} from "@/bot/features/vac/commands/helpers/vacConfigTargetResolver";
import { handleVacConfigRemoveTrigger } from "@/bot/features/vac/commands/usecases/vacConfigRemoveTrigger";
import { getBotVacRepository } from "@/bot/services/botVacDependencyResolver";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";
import { ValidationError } from "@/shared/errors/customErrors";
import { ChannelType, MessageFlags } from "discord.js";

jest.mock("@/shared/locale/localeManager", () => ({
  tDefault: jest.fn((key: string) => key),
  tGuild: jest.fn(async (_guildId: string, key: string) => key),
}));

jest.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: jest.fn(),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: jest.fn((description: string) => ({ description })),
}));

jest.mock(
  "@/bot/features/vac/commands/helpers/vacConfigTargetResolver",
  () => ({
    resolveTargetCategory: jest.fn(),
    findTriggerChannelByCategory: jest.fn(),
  }),
);

describe("bot/features/vac/commands/usecases/vacConfigRemoveTrigger", () => {
  // remove-trigger-vc のガード分岐と削除フローを検証する
  beforeEach(() => {
    jest.clearAllMocks();
    (resolveTargetCategory as jest.Mock).mockResolvedValue(null);
  });

  it("throws ValidationError when guild context is missing", async () => {
    const interaction = {
      guild: null,
      channelId: "ch-1",
      options: { getString: jest.fn() },
      reply: jest.fn(),
    };

    await expect(
      handleVacConfigRemoveTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when trigger channel is not found", async () => {
    (getBotVacRepository as jest.Mock).mockReturnValue({
      getVacConfigOrDefault: jest
        .fn()
        .mockResolvedValue({ triggerChannelIds: [] }),
      removeTriggerChannel: jest.fn(),
    });
    (findTriggerChannelByCategory as jest.Mock).mockResolvedValue(null);

    const interaction = {
      guild: { channels: { fetch: jest.fn() } },
      channelId: "ch-1",
      options: { getString: jest.fn(() => "cat-1") },
      reply: jest.fn(),
    };

    await expect(
      handleVacConfigRemoveTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("removes trigger from config, deletes channel, and replies ephemeral", async () => {
    const removeTriggerChannel = jest.fn().mockResolvedValue(undefined);
    (getBotVacRepository as jest.Mock).mockReturnValue({
      getVacConfigOrDefault: jest.fn().mockResolvedValue({
        triggerChannelIds: ["trigger-1"],
      }),
      removeTriggerChannel,
    });
    (findTriggerChannelByCategory as jest.Mock).mockResolvedValue({
      id: "trigger-1",
      name: "CreateVC",
    });

    const deleteMock = jest.fn().mockResolvedValue(undefined);
    const fetch = jest.fn().mockResolvedValue({
      id: "trigger-1",
      type: ChannelType.GuildVoice,
      delete: deleteMock,
    });
    const reply = jest.fn().mockResolvedValue(undefined);
    const interaction = {
      guild: { channels: { fetch } },
      channelId: "ch-1",
      options: { getString: jest.fn(() => "cat-1") },
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
