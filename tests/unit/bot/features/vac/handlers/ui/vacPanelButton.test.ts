import { vacPanelButtonHandler } from "@/bot/features/vac/handlers/ui/vacPanelButton";
import { safeReply } from "@/bot/utils/interaction";

const isManagedVacChannelMock = vi.fn();
const sendVacControlPanelMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(async (_guildId: string, key: string) => key),
}));

vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: vi.fn(() => ({
    isManagedVacChannel: isManagedVacChannelMock,
  })),
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
    RENAME_BUTTON_PREFIX: "vac:rename-btn:",
    LIMIT_BUTTON_PREFIX: "vac:limit-btn:",
    AFK_BUTTON_PREFIX: "vac:afk-btn:",
    REFRESH_BUTTON_PREFIX: "vac:refresh-btn:",
    RENAME_MODAL_PREFIX: "vac:rename-modal:",
    LIMIT_MODAL_PREFIX: "vac:limit-modal:",
    AFK_SELECT_PREFIX: "vac:afk-select:",
    RENAME_INPUT: "rename-input",
    LIMIT_INPUT: "limit-input",
  },
  getVacPanelChannelId: vi.fn((customId: string, prefix: string) =>
    customId.startsWith(prefix) ? customId.slice(prefix.length) : "",
  ),
  sendVacControlPanel: (...args: unknown[]) => sendVacControlPanelMock(...args),
}));

describe("bot/features/vac/handlers/ui/vacPanelButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isManagedVacChannelMock.mockResolvedValue(true);
    sendVacControlPanelMock.mockResolvedValue(undefined);
  });

  it("matches only supported button customId prefixes", () => {
    expect(vacPanelButtonHandler.matches("vac:rename-btn:voice-1")).toBe(true);
    expect(vacPanelButtonHandler.matches("vac:limit-btn:voice-1")).toBe(true);
    expect(vacPanelButtonHandler.matches("vac:afk-btn:voice-1")).toBe(true);
    expect(vacPanelButtonHandler.matches("vac:refresh-btn:voice-1")).toBe(
      true,
    );
    expect(vacPanelButtonHandler.matches("other:voice-1")).toBe(false);
  });

  it("returns early when customId is unsupported", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: vi.fn(),
        },
      },
      customId: "other:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: vi.fn() },
      showModal: vi.fn(),
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(interaction.guild.channels.fetch).not.toHaveBeenCalled();
    expect(safeReply).not.toHaveBeenCalled();
  });

  it("refreshes control panel and replies success even when old message deletion fails", async () => {
    const channel = {
      id: "voice-1",
      type: 2,
      members: { size: 3 },
    };
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:refresh-btn:voice-1",
      user: { id: "user-1" },
      message: {
        deletable: true,
        delete: vi.fn().mockRejectedValue(new Error("delete failed")),
      },
      showModal: vi.fn(),
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(sendVacControlPanelMock).toHaveBeenCalledWith(channel);
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.panel_refreshed" }],
      flags: 64,
    });
  });

  it("replies not-in-vc error when operator is not in target voice channel", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: vi.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: { channelId: "other-voice" },
          }),
        },
      },
      customId: "vac:rename-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: vi.fn() },
      showModal: vi.fn(),
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_in_vc" }],
      flags: 64,
    });
  });
});
