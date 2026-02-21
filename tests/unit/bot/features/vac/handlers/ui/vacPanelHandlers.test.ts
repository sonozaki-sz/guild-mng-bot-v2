import { vacPanelButtonHandler } from "@/bot/features/vac/handlers/ui/vacPanelButton";
import { vacPanelModalHandler } from "@/bot/features/vac/handlers/ui/vacPanelModal";
import { vacPanelUserSelectHandler } from "@/bot/features/vac/handlers/ui/vacPanelUserSelect";
import { safeReply } from "@/bot/utils/interaction";

const isManagedVacChannelMock = jest.fn().mockResolvedValue(true);
const getAfkConfigMock = jest.fn();
const getGuildConfigRepositoryMock = jest.fn(() => ({
  getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
}));

// VAC パネル customId 定数を固定化して matches 判定を検証しやすくする
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
  getVacPanelChannelId: jest.fn(() => "voice-1"),
  sendVacControlPanel: jest.fn(),
}));

// 外部依存の副作用を抑えるため、呼び出し不要なモジュールはダミー化
jest.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: jest.fn(() => ({
    isManagedVacChannel: isManagedVacChannelMock,
  })),
}));
jest.mock("@/shared/features/vac/vacConfigService", () => ({
  isManagedVacChannel: isManagedVacChannelMock,
}));
jest.mock("@/bot/services/botGuildConfigRepositoryResolver", () => ({
  getBotGuildConfigRepository: jest.fn(() => getGuildConfigRepositoryMock()),
}));
jest.mock("@/shared/database/guildConfigRepositoryProvider", () => ({
  getGuildConfigRepository: getGuildConfigRepositoryMock,
}));
jest.mock("@/shared/locale/localeManager", () => ({
  tGuild: jest.fn(async (_guildId: string, key: string) => key),
}));
jest.mock("@/bot/utils/interaction", () => ({
  safeReply: jest.fn(),
}));
jest.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: jest.fn((message: string) => ({ message })),
  createSuccessEmbed: jest.fn((message: string) => ({ message })),
}));

describe("bot/features/vac/ui handlers", () => {
  // 各ケース前にモックを初期化する
  beforeEach(() => {
    jest.clearAllMocks();
    getAfkConfigMock.mockResolvedValue({ enabled: true, channelId: "afk-1" });
  });

  // `matches` が customId prefix ベースで判定できることを検証
  it("matches expected custom IDs", () => {
    expect(vacPanelButtonHandler.matches("vac:rename-btn:voice-1")).toBe(true);
    expect(vacPanelButtonHandler.matches("vac:limit-btn:voice-1")).toBe(true);
    expect(vacPanelButtonHandler.matches("vac:afk-btn:voice-1")).toBe(true);
    expect(vacPanelButtonHandler.matches("vac:refresh-btn:voice-1")).toBe(true);
    expect(vacPanelButtonHandler.matches("other:voice-1")).toBe(false);

    expect(vacPanelModalHandler.matches("vac:rename-modal:voice-1")).toBe(true);
    expect(vacPanelModalHandler.matches("vac:limit-modal:voice-1")).toBe(true);
    expect(vacPanelModalHandler.matches("other:voice-1")).toBe(false);

    expect(vacPanelUserSelectHandler.matches("vac:afk-select:voice-1")).toBe(
      true,
    );
    expect(vacPanelUserSelectHandler.matches("other:voice-1")).toBe(false);
  });

  // guild が無い場合は副作用なく return することを検証
  it("returns early when guild is missing", async () => {
    await expect(
      vacPanelButtonHandler.execute({ guild: null } as never),
    ).resolves.toBeUndefined();

    await expect(
      vacPanelModalHandler.execute({ guild: null } as never),
    ).resolves.toBeUndefined();

    await expect(
      vacPanelUserSelectHandler.execute({ guild: null } as never),
    ).resolves.toBeUndefined();
  });

  // ボタン処理で対象VCが取得できない場合はエラー応答することを検証
  it("replies error when button target channel is not a voice channel", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue(null),
        },
      },
      customId: "vac:rename-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn(),
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("returns early when button custom id has no panel channel", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn(),
        },
      },
      customId: "unknown:custom-id",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn(),
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(interaction.guild.channels.fetch).not.toHaveBeenCalled();
    expect(safeReply).not.toHaveBeenCalled();
  });

  it("replies error when button target channel fetch fails", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
        },
      },
      customId: "vac:rename-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn(),
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("replies error when button target channel is not managed", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
      },
      customId: "vac:rename-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn(),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(false);

    await vacPanelButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("replies error when button operator is not in vc", async () => {
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

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_in_vc" }],
      flags: 64,
    });
  });

  it("replies error when button operator fetch fails", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
        members: {
          fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
        },
      },
      customId: "vac:rename-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn(),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_in_vc" }],
      flags: 64,
    });
  });

  it("shows rename modal on rename button", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:rename-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn().mockResolvedValue(undefined),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelButtonHandler.execute(interaction as never);

    expect(interaction.showModal).toHaveBeenCalledTimes(1);
  });

  it("shows limit modal on limit button", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:limit-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn().mockResolvedValue(undefined),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelButtonHandler.execute(interaction as never);

    expect(interaction.showModal).toHaveBeenCalledTimes(1);
  });

  it("replies with user-select menu on AFK button", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            members: { size: 0 },
          }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:afk-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: jest.fn() },
      showModal: jest.fn(),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelButtonHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({
        components: expect.any(Array),
        flags: 64,
      }),
    );
  });

  it("refreshes panel and replies success when refresh button pressed", async () => {
    const deleteMock = jest.fn().mockResolvedValue(undefined);
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            members: { size: 3 },
          }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:refresh-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: true, delete: deleteMock },
      showModal: jest.fn(),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const panelModule = jest.requireMock(
      "@/bot/features/vac/handlers/ui/vacControlPanel",
    ) as {
      sendVacControlPanel: jest.Mock;
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(panelModule.sendVacControlPanel).toHaveBeenCalledWith({
      id: "voice-1",
      type: 2,
      members: { size: 3 },
    });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.panel_refreshed" }],
      flags: 64,
    });
  });

  it("refreshes panel when refresh message is not deletable", async () => {
    const deleteMock = jest.fn();
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            members: { size: 1 },
          }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:refresh-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: false, delete: deleteMock },
      showModal: jest.fn(),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const panelModule = jest.requireMock(
      "@/bot/features/vac/handlers/ui/vacControlPanel",
    ) as {
      sendVacControlPanel: jest.Mock;
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(deleteMock).not.toHaveBeenCalled();
    expect(panelModule.sendVacControlPanel).toHaveBeenCalledTimes(1);
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.panel_refreshed" }],
      flags: 64,
    });
  });

  it("continues refresh flow when delete fails", async () => {
    const deleteMock = jest.fn().mockRejectedValue(new Error("delete failed"));
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            members: { size: 1 },
          }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:refresh-btn:voice-1",
      user: { id: "user-1" },
      message: { deletable: true, delete: deleteMock },
      showModal: jest.fn(),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const panelModule = jest.requireMock(
      "@/bot/features/vac/handlers/ui/vacControlPanel",
    ) as {
      sendVacControlPanel: jest.Mock;
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(panelModule.sendVacControlPanel).toHaveBeenCalledTimes(1);
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.panel_refreshed" }],
      flags: 64,
    });
  });

  it("falls through when no button action matches after channel resolution", async () => {
    const startsWithMock = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    const customId = {
      startsWith: startsWithMock,
    } as unknown as string;

    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            members: { size: 1 },
          }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId,
      user: { id: "user-1" },
      message: { deletable: true, delete: jest.fn() },
      showModal: jest.fn(),
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const panelModule = jest.requireMock(
      "@/bot/features/vac/handlers/ui/vacControlPanel",
    ) as {
      sendVacControlPanel: jest.Mock;
    };

    await vacPanelButtonHandler.execute(interaction as never);

    expect(interaction.showModal).not.toHaveBeenCalled();
    expect(panelModule.sendVacControlPanel).not.toHaveBeenCalled();
    expect(safeReply).not.toHaveBeenCalledWith(
      interaction,
      expect.objectContaining({
        embeds: [{ message: "commands:vac.embed.panel_refreshed" }],
      }),
    );
  });

  // モーダル処理で人数制限が範囲外の場合はエラー応答することを検証
  it("replies error when modal limit input is out of range", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            edit: jest.fn(),
          }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:limit-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "120"),
      },
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelModalHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.limit_out_of_range" }],
      flags: 64,
    });
  });

  it("replies error when modal target channel is not a voice channel", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue(null),
        },
      },
      customId: "vac:rename-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "new-name"),
      },
    };

    await vacPanelModalHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("replies error when modal channel fetch fails", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
        },
      },
      customId: "vac:rename-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "new-name"),
      },
    };

    await vacPanelModalHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("replies error when modal target channel is not managed", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            edit: jest.fn(),
          }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:rename-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "new-name"),
      },
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(false);

    await vacPanelModalHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("replies error when modal operator is not in target voice channel", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            edit: jest.fn(),
          }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "other-voice" },
          }),
        },
      },
      customId: "vac:rename-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "new-name"),
      },
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelModalHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_in_vc" }],
      flags: 64,
    });
  });

  it("replies error when modal member fetch fails", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "voice-1",
            type: 2,
            edit: jest.fn(),
          }),
        },
        members: {
          fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
        },
      },
      customId: "vac:rename-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "new-name"),
      },
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelModalHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_in_vc" }],
      flags: 64,
    });
  });

  it("replies error when modal rename input is empty", async () => {
    const voiceChannel = {
      id: "voice-1",
      type: 2,
      edit: jest.fn(),
    };

    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue(voiceChannel),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:rename-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "   "),
      },
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelModalHandler.execute(interaction as never);

    expect(voiceChannel.edit).not.toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("renames channel and replies success on modal rename", async () => {
    const voiceChannel = {
      id: "voice-1",
      type: 2,
      edit: jest.fn().mockResolvedValue(undefined),
    };

    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue(voiceChannel),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:rename-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "my-vc"),
      },
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelModalHandler.execute(interaction as never);

    expect(voiceChannel.edit).toHaveBeenCalledWith({ name: "my-vc" });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.renamed" }],
      flags: 64,
    });
  });

  it("updates channel user limit and replies success for non-zero limit", async () => {
    const voiceChannel = {
      id: "voice-1",
      type: 2,
      edit: jest.fn().mockResolvedValue(undefined),
    };

    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue(voiceChannel),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:limit-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "5"),
      },
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelModalHandler.execute(interaction as never);

    expect(voiceChannel.edit).toHaveBeenCalledWith({ userLimit: 5 });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.limit_changed" }],
      flags: 64,
    });
  });

  it("updates channel user limit and treats zero as unlimited", async () => {
    const voiceChannel = {
      id: "voice-1",
      type: 2,
      edit: jest.fn().mockResolvedValue(undefined),
    };

    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue(voiceChannel),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:limit-modal:voice-1",
      user: { id: "user-1" },
      fields: {
        getTextInputValue: jest.fn(() => "0"),
      },
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelModalHandler.execute(interaction as never);

    expect(voiceChannel.edit).toHaveBeenCalledWith({ userLimit: 0 });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.limit_changed" }],
      flags: 64,
    });
  });

  // user-select で対象ユーザーをAFKへ移動し成功応答することを検証
  it("moves selected users to AFK channel on user-select success path", async () => {
    const movedMember = {
      voice: {
        channelId: "voice-1",
        setChannel: jest.fn().mockResolvedValue(undefined),
      },
    };
    const skippedMember = {
      voice: {
        channelId: "other-voice",
        setChannel: jest.fn(),
      },
    };

    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest
            .fn()
            .mockResolvedValueOnce({
              id: "voice-1",
              type: 2,
              members: { size: 2 },
            })
            .mockResolvedValueOnce({ id: "afk-1", type: 2 }),
        },
        members: {
          fetch: jest.fn((userId: string) => {
            if (userId === "operator") {
              return Promise.resolve({ voice: { channelId: "voice-1" } });
            }
            if (userId === "move-user") {
              return Promise.resolve(movedMember);
            }
            if (userId === "skip-user") {
              return Promise.resolve(skippedMember);
            }
            return Promise.resolve(null);
          }),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["move-user", "skip-user"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const databaseModule = jest.requireMock(
      "@/shared/database/guildConfigRepositoryProvider",
    ) as {
      getGuildConfigRepository: jest.Mock;
    };
    databaseModule.getGuildConfigRepository.mockReturnValue({
      getAfkConfig: jest.fn().mockResolvedValue({
        enabled: true,
        channelId: "afk-1",
      }),
    });

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(movedMember.voice.setChannel).toHaveBeenCalledWith({
      id: "afk-1",
      type: 2,
    });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.members_moved" }],
      flags: 64,
    });
  });

  it("replies error when user-select target channel is invalid", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue(null),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["user-1"],
    };

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("replies error when user-select target channel fetch fails", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["user-1"],
    };

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("replies error when user-select target channel is not managed", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["user-1"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(false);

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  it("replies error when user-select operator is not in vc", async () => {
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
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["user-1"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_in_vc" }],
      flags: 64,
    });
  });

  it("replies error when user-select operator fetch fails", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
        members: {
          fetch: jest
            .fn()
            .mockRejectedValue(new Error("operator fetch failed")),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["user-1"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_in_vc" }],
      flags: 64,
    });
  });

  it("replies error when AFK config is missing", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest.fn().mockResolvedValue({ id: "voice-1", type: 2 }),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["user-1"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const databaseModule = jest.requireMock(
      "@/shared/database/guildConfigRepositoryProvider",
    ) as {
      getGuildConfigRepository: jest.Mock;
    };
    databaseModule.getGuildConfigRepository.mockReturnValue({
      getAfkConfig: jest.fn().mockResolvedValue(null),
    });

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:afk.not_configured" }],
      flags: 64,
    });
  });

  it("replies error when AFK channel is not found", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest
            .fn()
            .mockResolvedValueOnce({ id: "voice-1", type: 2 })
            .mockResolvedValueOnce(null),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["user-1"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const databaseModule = jest.requireMock(
      "@/shared/database/guildConfigRepositoryProvider",
    ) as {
      getGuildConfigRepository: jest.Mock;
    };
    databaseModule.getGuildConfigRepository.mockReturnValue({
      getAfkConfig: jest.fn().mockResolvedValue({
        enabled: true,
        channelId: "afk-1",
      }),
    });

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:afk.channel_not_found" }],
      flags: 64,
    });
  });

  it("replies error when AFK channel fetch fails", async () => {
    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest
            .fn()
            .mockResolvedValueOnce({ id: "voice-1", type: 2 })
            .mockRejectedValueOnce(new Error("afk fetch failed")),
        },
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: { channelId: "voice-1" },
          }),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["user-1"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const databaseModule = jest.requireMock(
      "@/shared/database/guildConfigRepositoryProvider",
    ) as {
      getGuildConfigRepository: jest.Mock;
    };
    databaseModule.getGuildConfigRepository.mockReturnValue({
      getAfkConfig: jest.fn().mockResolvedValue({
        enabled: true,
        channelId: "afk-1",
      }),
    });

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:afk.channel_not_found" }],
      flags: 64,
    });
  });

  it("continues when setChannel fails and still replies success", async () => {
    const failingMoveMember = {
      voice: {
        channelId: "voice-1",
        setChannel: jest.fn().mockRejectedValue(new Error("move failed")),
      },
    };

    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest
            .fn()
            .mockResolvedValueOnce({ id: "voice-1", type: 2 })
            .mockResolvedValueOnce({ id: "afk-1", type: 2 }),
        },
        members: {
          fetch: jest.fn((userId: string) => {
            if (userId === "operator") {
              return Promise.resolve({ voice: { channelId: "voice-1" } });
            }
            if (userId === "move-user") {
              return Promise.resolve(failingMoveMember);
            }
            return Promise.resolve(null);
          }),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["move-user"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const databaseModule = jest.requireMock(
      "@/shared/database/guildConfigRepositoryProvider",
    ) as {
      getGuildConfigRepository: jest.Mock;
    };
    databaseModule.getGuildConfigRepository.mockReturnValue({
      getAfkConfig: jest.fn().mockResolvedValue({
        enabled: true,
        channelId: "afk-1",
      }),
    });

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(failingMoveMember.voice.setChannel).toHaveBeenCalledWith({
      id: "afk-1",
      type: 2,
    });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.members_moved" }],
      flags: 64,
    });
  });

  it("continues when selected member fetch fails and still replies success", async () => {
    const movableMember = {
      voice: {
        channelId: "voice-1",
        setChannel: jest.fn().mockResolvedValue(undefined),
      },
    };

    const interaction = {
      guild: {
        id: "guild-1",
        channels: {
          fetch: jest
            .fn()
            .mockResolvedValueOnce({ id: "voice-1", type: 2 })
            .mockResolvedValueOnce({ id: "afk-1", type: 2 }),
        },
        members: {
          fetch: jest.fn((userId: string) => {
            if (userId === "operator") {
              return Promise.resolve({ voice: { channelId: "voice-1" } });
            }
            if (userId === "broken-user") {
              return Promise.reject(new Error("member fetch failed"));
            }
            if (userId === "move-user") {
              return Promise.resolve(movableMember);
            }
            return Promise.resolve(null);
          }),
        },
      },
      customId: "vac:afk-select:voice-1",
      user: { id: "operator" },
      values: ["broken-user", "move-user"],
    };

    const featureModule = jest.requireMock(
      "@/shared/features/vac/vacConfigService",
    ) as {
      isManagedVacChannel: jest.Mock;
    };
    featureModule.isManagedVacChannel.mockResolvedValue(true);

    const databaseModule = jest.requireMock(
      "@/shared/database/guildConfigRepositoryProvider",
    ) as {
      getGuildConfigRepository: jest.Mock;
    };
    databaseModule.getGuildConfigRepository.mockReturnValue({
      getAfkConfig: jest.fn().mockResolvedValue({
        enabled: true,
        channelId: "afk-1",
      }),
    });

    await vacPanelUserSelectHandler.execute(interaction as never);

    expect(movableMember.voice.setChannel).toHaveBeenCalledWith({
      id: "afk-1",
      type: 2,
    });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "commands:vac.embed.members_moved" }],
      flags: 64,
    });
  });
});
