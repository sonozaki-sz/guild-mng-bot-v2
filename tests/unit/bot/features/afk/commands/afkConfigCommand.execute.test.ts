import { executeAfkConfigCommand } from "@/bot/features/afk/commands/afkConfigCommand.execute";
import { ValidationError } from "@/shared/errors";
import { ChannelType, PermissionFlagsBits } from "discord.js";

const setAfkChannelMock = jest.fn();
const getAfkConfigMock = jest.fn();
const tGuildMock = jest.fn();
const tDefaultMock = jest.fn((key: string) => `default:${key}`);
const createSuccessEmbedMock = jest.fn((description: string) => ({
  description,
  kind: "success",
}));
const createInfoEmbedMock = jest.fn((description: string) => ({
  description,
  kind: "info",
}));

jest.mock("@/bot/services/botGuildConfigRepositoryResolver", () => ({
  getBotGuildConfigRepository: () => ({
    setAfkChannel: (...args: unknown[]) => setAfkChannelMock(...args),
    getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
  }),
}));

jest.mock("@/shared/locale", () => ({
  tDefault: (key: string) => tDefaultMock(key),
  tGuild: (guildId: string, key: string, params?: Record<string, unknown>) =>
    tGuildMock(guildId, key, params),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    info: jest.fn(),
  },
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
  createInfoEmbed: (description: string) => createInfoEmbedMock(description),
}));

function createInteraction(subcommand: string) {
  return {
    guildId: "guild-1",
    memberPermissions: {
      has: jest.fn(() => true),
    },
    options: {
      getSubcommand: jest.fn(() => subcommand),
      getChannel: jest.fn(() => ({
        id: "afk-channel",
        type: ChannelType.GuildVoice,
      })),
    },
    reply: jest.fn().mockResolvedValue(undefined),
  };
}

describe("bot/features/afk/commands/afkConfigCommand.execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tGuildMock.mockResolvedValue("translated");
    getAfkConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "afk-channel",
    });
  });

  it("throws ValidationError when member lacks manage-guild permission", async () => {
    const interaction = createInteraction("set-ch");
    interaction.memberPermissions.has.mockReturnValue(false);

    await expect(
      executeAfkConfigCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
  });

  it("sets AFK channel and replies success on set-ch", async () => {
    const interaction = createInteraction("set-ch");

    await executeAfkConfigCommand(interaction as never);

    expect(setAfkChannelMock).toHaveBeenCalledWith("guild-1", "afk-channel");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated", kind: "success" }],
      flags: 64,
    });
  });

  it("shows current config on show", async () => {
    const interaction = createInteraction("show");

    await executeAfkConfigCommand(interaction as never);

    expect(getAfkConfigMock).toHaveBeenCalledWith("guild-1");
    expect(createInfoEmbedMock).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "", kind: "info" }],
      flags: 64,
    });
  });
});
