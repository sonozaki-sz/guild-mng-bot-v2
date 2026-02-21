import { executeAfkCommand } from "@/bot/features/afk/commands/afkCommand.execute";
import { ValidationError } from "@/shared/errors";

const getAfkConfigMock = jest.fn();
const tGuildMock = jest.fn();
const tDefaultMock = jest.fn((key: string) => `default:${key}`);
const createSuccessEmbedMock = jest.fn((description: string) => ({
  description,
}));
const loggerInfoMock = jest.fn();

jest.mock("@/bot/services/botGuildConfigRepositoryResolver", () => ({
  getBotGuildConfigRepository: () => ({
    getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
  }),
}));

jest.mock("@/shared/locale", () => ({
  tDefault: (key: string) => tDefaultMock(key),
  tGuild: (guildId: string, key: string, params?: Record<string, unknown>) =>
    tGuildMock(guildId, key, params),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

function createInteraction() {
  const setChannelMock = jest.fn().mockResolvedValue(undefined);
  return {
    guildId: "guild-1",
    user: { id: "user-1" },
    options: {
      getUser: jest.fn(() => null),
    },
    guild: {
      members: {
        fetch: jest.fn().mockResolvedValue({
          voice: {
            channel: { id: "voice-1" },
            setChannel: setChannelMock,
          },
        }),
      },
      channels: {
        fetch: jest.fn().mockResolvedValue({
          id: "afk-channel",
          type: 2,
        }),
      },
    },
    reply: jest.fn().mockResolvedValue(undefined),
    setChannelMock,
  };
}

describe("bot/features/afk/commands/afkCommand.execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAfkConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "afk-channel",
    });
    tGuildMock.mockResolvedValue("translated");
  });

  it("throws ValidationError when guildId is missing", async () => {
    const interaction = createInteraction();
    interaction.guildId = null as never;

    await expect(
      executeAfkCommand(interaction as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("moves target user and replies success embed", async () => {
    const interaction = createInteraction();

    await executeAfkCommand(interaction as never);

    expect(interaction.setChannelMock).toHaveBeenCalledWith({
      id: "afk-channel",
      type: 2,
    });
    expect(createSuccessEmbedMock).toHaveBeenCalledWith("translated");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
    });
    expect(loggerInfoMock).toHaveBeenCalledTimes(1);
  });
});
