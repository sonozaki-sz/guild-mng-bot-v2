import type { Mock } from "vitest";
import {
  findTriggerChannelByCategory,
  resolveTargetCategory,
} from "@/bot/features/vac/commands/helpers/vacConfigTargetResolver";
import { handleVacConfigCreateTrigger } from "@/bot/features/vac/commands/usecases/vacConfigCreateTrigger";
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

describe("bot/features/vac/commands/usecases/vacConfigCreateTrigger", () => {
  // create-trigger-vc のガード分岐と成功経路を検証する
  beforeEach(() => {
    vi.clearAllMocks();
    (findTriggerChannelByCategory as Mock).mockResolvedValue(null);
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
      handleVacConfigCreateTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when trigger already exists in target category", async () => {
    const getVacConfigOrDefault = vi.fn().mockResolvedValue({
      triggerChannelIds: ["trigger-1"],
    });
    (getBotVacRepository as Mock).mockReturnValue({
      getVacConfigOrDefault,
      addTriggerChannel: vi.fn(),
    });
    (findTriggerChannelByCategory as Mock).mockResolvedValue({
      id: "trigger-1",
      type: ChannelType.GuildVoice,
    });

    const interaction = {
      guild: {
        channels: { create: vi.fn() },
      },
      channelId: "ch-1",
      options: { getString: vi.fn(() => "cat-1") },
      reply: vi.fn(),
    };

    await expect(
      handleVacConfigCreateTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when target category is full", async () => {
    const getVacConfigOrDefault = vi.fn().mockResolvedValue({
      triggerChannelIds: [],
    });
    (getBotVacRepository as Mock).mockReturnValue({
      getVacConfigOrDefault,
      addTriggerChannel: vi.fn(),
    });
    (resolveTargetCategory as Mock).mockResolvedValue({
      id: "cat-1",
      children: { cache: { size: 50 } },
    });

    const interaction = {
      guild: {
        channels: { create: vi.fn() },
      },
      channelId: "ch-1",
      options: { getString: vi.fn(() => "cat-1") },
      reply: vi.fn(),
    };

    await expect(
      handleVacConfigCreateTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("creates trigger channel, persists it, and replies ephemeral", async () => {
    const addTriggerChannel = vi.fn().mockResolvedValue(undefined);
    const getVacConfigOrDefault = vi.fn().mockResolvedValue({
      triggerChannelIds: [],
    });
    (getBotVacRepository as Mock).mockReturnValue({
      getVacConfigOrDefault,
      addTriggerChannel,
    });
    (resolveTargetCategory as Mock).mockResolvedValue({
      id: "cat-1",
      children: { cache: { size: 0 } },
    });

    const create = vi.fn().mockResolvedValue({ id: "trigger-new" });
    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guild: { channels: { create } },
      channelId: "ch-1",
      options: { getString: vi.fn(() => "cat-1") },
      reply,
    };

    await handleVacConfigCreateTrigger(interaction as never, "guild-1");

    expect(create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: "cat-1",
    });
    expect(addTriggerChannel).toHaveBeenCalledWith("guild-1", "trigger-new");
    expect(createSuccessEmbed).toHaveBeenCalledWith(
      "commands:vac-config.embed.trigger_created",
    );
    expect(reply).toHaveBeenCalledWith({
      embeds: [{ description: "commands:vac-config.embed.trigger_created" }],
      flags: MessageFlags.Ephemeral,
    });
  });
});
