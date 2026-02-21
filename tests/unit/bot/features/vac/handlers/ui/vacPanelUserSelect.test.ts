import { vacPanelUserSelectHandler } from "@/bot/features/vac/handlers/ui/vacPanelUserSelect";
import { safeReply } from "@/bot/utils/interaction";

const isManagedVacChannelMock = jest.fn();
const getAfkConfigMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tGuild: jest.fn(
    async (_guildId: string, key: string, params?: Record<string, unknown>) => {
      if (key === "commands:vac.embed.members_moved") {
        return `moved:${String(params?.count)}`;
      }
      return key;
    },
  ),
}));

jest.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: jest.fn(() => ({
    isManagedVacChannel: isManagedVacChannelMock,
  })),
}));

jest.mock("@/bot/services/botGuildConfigRepositoryResolver", () => ({
  getBotGuildConfigRepository: jest.fn(() => ({
    getAfkConfig: getAfkConfigMock,
  })),
}));

jest.mock("@/bot/utils/interaction", () => ({
  safeReply: jest.fn(),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: jest.fn((message: string) => ({ message })),
  createSuccessEmbed: jest.fn((message: string) => ({ message })),
}));

jest.mock("@/bot/features/vac/handlers/ui/vacControlPanel", () => ({
  VAC_PANEL_CUSTOM_ID: {
    AFK_SELECT_PREFIX: "vac:afk-select:",
  },
  getVacPanelChannelId: jest.fn((customId: string, prefix: string) =>
    customId.startsWith(prefix) ? customId.slice(prefix.length) : "",
  ),
}));

function createInteraction(options?: {
  channel?: unknown;
  operatorChannelId?: string;
  values?: string[];
}) {
  const targetChannel =
    options?.channel ??
    ({ id: "voice-1", type: 2, members: { size: 3 } } as const);

  const user1SetChannel = jest.fn().mockResolvedValue(undefined);
  const user2SetChannel = jest.fn().mockResolvedValue(undefined);

  const membersFetch = jest.fn(async (userId: string) => {
    if (userId === "user-1") {
      return {
        voice: { channelId: options?.operatorChannelId ?? "voice-1" },
      };
    }
    if (userId === "target-1") {
      return {
        voice: {
          channelId: "voice-1",
          setChannel: user1SetChannel,
        },
      };
    }
    if (userId === "target-2") {
      return {
        voice: {
          channelId: "other-voice",
          setChannel: user2SetChannel,
        },
      };
    }
    return null;
  });

  const afkChannel = { id: "afk-1", type: 2 };
  const channelsFetch = jest.fn(async (channelId: string) => {
    if (channelId === "voice-1") {
      return targetChannel;
    }
    if (channelId === "afk-1") {
      return afkChannel;
    }
    return null;
  });

  return {
    interaction: {
      guild: {
        id: "guild-1",
        channels: { fetch: channelsFetch },
        members: { fetch: membersFetch },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "user-1" },
      values: options?.values ?? ["target-1", "target-2"],
    },
    user1SetChannel,
    user2SetChannel,
  };
}

describe("bot/features/vac/handlers/ui/vacPanelUserSelect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isManagedVacChannelMock.mockResolvedValue(true);
    getAfkConfigMock.mockResolvedValue({ enabled: true, channelId: "afk-1" });
  });

  it("matches only AFK select customId prefix", () => {
    expect(vacPanelUserSelectHandler.matches("vac:afk-select:voice-1")).toBe(
      true,
    );
    expect(vacPanelUserSelectHandler.matches("other:voice-1")).toBe(false);
  });

  it("replies not-configured error when AFK config is unavailable", async () => {
    getAfkConfigMock.mockResolvedValueOnce(null);
    const { interaction } = createInteraction();

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:afk.not_configured" }],
      flags: 64,
    });
  });

  it("moves only members currently in target voice channel and replies moved count", async () => {
    const { interaction, user1SetChannel, user2SetChannel } =
      createInteraction();

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(user1SetChannel).toHaveBeenCalledWith({ id: "afk-1", type: 2 });
    expect(user2SetChannel).not.toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "moved:1" }],
      flags: 64,
    });
  });
});
