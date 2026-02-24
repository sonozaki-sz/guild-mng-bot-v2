import { vacPanelUserSelectHandler } from "@/bot/features/vac/handlers/ui/vacPanelUserSelect";
import { safeReply } from "@/bot/utils/interaction";

const isManagedVacChannelMock = vi.fn();
const getAfkConfigMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(
    async (_guildId: string, key: string, params?: Record<string, unknown>) => {
      if (key === "commands:vac.embed.members_moved") {
        return `moved:${String(params?.channel)}`;
      }
      return key;
    },
  ),
}));

vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: vi.fn(() => ({
    isManagedVacChannel: isManagedVacChannelMock,
  })),
}));

vi.mock("@/shared/features/afk/afkConfigService", () => ({
  getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
}));

vi.mock("@/bot/utils/interaction", () => ({
  safeReply: vi.fn(),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((message: string) => ({ message })),
  createSuccessEmbed: vi.fn((message: string) => ({ message })),
}));

vi.mock("@/bot/features/vac/handlers/ui/vacControlPanel", () => ({
  VAC_PANEL_CUSTOM_ID: {
    AFK_SELECT_PREFIX: "vac:afk-select:",
  },
  getVacPanelChannelId: vi.fn((customId: string, prefix: string) =>
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

  const user1SetChannel = vi.fn().mockResolvedValue(undefined);
  const user2SetChannel = vi.fn().mockResolvedValue(undefined);

  const membersFetch = vi.fn(async (userId: string) => {
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
  const channelsFetch = vi.fn(async (channelId: string) => {
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
    vi.clearAllMocks();
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
      embeds: [{ message: "moved:[object Object]" }],
      flags: 64,
    });
  });
});
