import {
  findTriggerChannelByCategory,
  resolveTargetCategory,
} from "@/bot/features/vac/commands/helpers/vacConfigTargetResolver";
import { handleVacConfigCreateTrigger } from "@/bot/features/vac/commands/usecases/vacConfigCreateTrigger";
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

describe("bot/features/vac/commands/usecases/vacConfigCreateTrigger", () => {
  // create-trigger-vc のガード分岐と成功経路を検証する
  beforeEach(() => {
    jest.clearAllMocks();
    (findTriggerChannelByCategory as jest.Mock).mockResolvedValue(null);
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
      handleVacConfigCreateTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when trigger already exists in target category", async () => {
    const getVacConfigOrDefault = jest.fn().mockResolvedValue({
      triggerChannelIds: ["trigger-1"],
    });
    (getBotVacRepository as jest.Mock).mockReturnValue({
      getVacConfigOrDefault,
      addTriggerChannel: jest.fn(),
    });
    (findTriggerChannelByCategory as jest.Mock).mockResolvedValue({
      id: "trigger-1",
      type: ChannelType.GuildVoice,
    });

    const interaction = {
      guild: {
        channels: { create: jest.fn() },
      },
      channelId: "ch-1",
      options: { getString: jest.fn(() => "cat-1") },
      reply: jest.fn(),
    };

    await expect(
      handleVacConfigCreateTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when target category is full", async () => {
    const getVacConfigOrDefault = jest.fn().mockResolvedValue({
      triggerChannelIds: [],
    });
    (getBotVacRepository as jest.Mock).mockReturnValue({
      getVacConfigOrDefault,
      addTriggerChannel: jest.fn(),
    });
    (resolveTargetCategory as jest.Mock).mockResolvedValue({
      id: "cat-1",
      children: { cache: { size: 50 } },
    });

    const interaction = {
      guild: {
        channels: { create: jest.fn() },
      },
      channelId: "ch-1",
      options: { getString: jest.fn(() => "cat-1") },
      reply: jest.fn(),
    };

    await expect(
      handleVacConfigCreateTrigger(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("creates trigger channel, persists it, and replies ephemeral", async () => {
    const addTriggerChannel = jest.fn().mockResolvedValue(undefined);
    const getVacConfigOrDefault = jest.fn().mockResolvedValue({
      triggerChannelIds: [],
    });
    (getBotVacRepository as jest.Mock).mockReturnValue({
      getVacConfigOrDefault,
      addTriggerChannel,
    });
    (resolveTargetCategory as jest.Mock).mockResolvedValue({
      id: "cat-1",
      children: { cache: { size: 0 } },
    });

    const create = jest.fn().mockResolvedValue({ id: "trigger-new" });
    const reply = jest.fn().mockResolvedValue(undefined);
    const interaction = {
      guild: { channels: { create } },
      channelId: "ch-1",
      options: { getString: jest.fn(() => "cat-1") },
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
