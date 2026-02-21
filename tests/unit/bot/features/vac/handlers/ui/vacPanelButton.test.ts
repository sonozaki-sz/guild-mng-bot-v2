import { safeReply } from "@/bot/utils/interaction";
import { vacPanelButtonHandler } from "@/bot/features/vac/handlers/ui/vacPanelButton";

const isManagedVacChannelMock = jest.fn();
const sendVacControlPanelMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tGuild: jest.fn(async (_guildId: string, key: string) => key),
}));

jest.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: jest.fn(() => ({
    isManagedVacChannel: isManagedVacChannelMock,
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
  getVacPanelChannelId: jest.fn((customId: string, prefix: string) =>
    customId.startsWith(prefix) ? customId.slice(prefix.length) : "",
  ),
  sendVacControlPanel: (...args: unknown[]) => sendVacControlPanelMock(...args),
}));

describe("bot/features/vac/handlers/ui/vacPanelButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
          fetch: jest.fn(),
        },
      },
      customId: "other:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn(),
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
          fetch: jest.fn().mockResolvedValue(channel),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:refresh-btn:voice-1",
      user: { id: "user-1" },
      message: {
        deletable: true,
        delete: jest.fn().mockRejectedValue(new Error("delete failed")),
      },
      showModal: jest.fn(),
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
          fetch: jest.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "other-voice" },
          }),
        },
      },
      customId: "vac:rename-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn(),
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_in_vc" }],
      flags: 64,
    });
  });
});
