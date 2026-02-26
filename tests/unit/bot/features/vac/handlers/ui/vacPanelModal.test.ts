// tests/unit/bot/features/vac/handlers/ui/vacPanelModal.test.ts
import { vacPanelModalHandler } from "@/bot/features/vac/handlers/ui/vacPanelModal";
import { safeReply } from "@/bot/utils/interaction";

const isManagedVacChannelMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(
    async (_guildId: string, key: string, params?: Record<string, unknown>) => {
      if (key === "commands:vac.embed.renamed") {
        return `renamed:${String(params?.name)}`;
      }
      if (key === "commands:vac.embed.limit_changed") {
        return `limit:${String(params?.limit)}`;
      }
      if (key === "commands:vac.embed.unlimited") {
        return "unlimited";
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

vi.mock("@/bot/utils/interaction", () => ({
  safeReply: vi.fn(),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((message: string) => ({ message })),
  createSuccessEmbed: vi.fn((message: string) => ({ message })),
}));

vi.mock("@/bot/features/vac/handlers/ui/vacControlPanel", () => ({
  VAC_PANEL_CUSTOM_ID: {
    RENAME_MODAL_PREFIX: "vac:rename-modal:",
    LIMIT_MODAL_PREFIX: "vac:limit-modal:",
    RENAME_INPUT: "rename-input",
    LIMIT_INPUT: "limit-input",
  },
  getVacPanelChannelId: vi.fn((customId: string, prefix: string) =>
    customId.startsWith(prefix) ? customId.slice(prefix.length) : "",
  ),
}));

function createBaseInteraction(overrides?: {
  customId?: string;
  channel?: unknown;
  memberChannelId?: string;
  renameInput?: string;
  limitInput?: string;
}) {
  const channel =
    overrides?.channel ??
    ({ id: "voice-1", type: 2, edit: vi.fn() } as const);

  return {
    guild: {
      id: "guild-1",
      channels: {
        fetch: vi.fn().mockResolvedValue(channel),
      },
      members: {
        fetch: vi.fn().mockResolvedValue({
          voice: { channelId: overrides?.memberChannelId ?? "voice-1" },
        }),
      },
    },
    customId: overrides?.customId ?? "vac:rename-modal:voice-1",
    user: { id: "user-1" },
    fields: {
      getTextInputValue: vi.fn((inputId: string) => {
        if (inputId === "rename-input") {
          return overrides?.renameInput ?? "Renamed VC";
        }
        return overrides?.limitInput ?? "10";
      }),
    },
  };
}

// VACパネルのリネーム・人数制限モーダルハンドラーを検証する
// customId マッチング・管理外チャンネルのエラー・入力トリム・数値バリデーション違反の各フローを確認する
describe("bot/features/vac/handlers/ui/vacPanelModal", () => {
  // 毎テストで isManagedVacChannel が true を返すデフォルト正常状態に戻す
  beforeEach(() => {
    vi.clearAllMocks();
    isManagedVacChannelMock.mockResolvedValue(true);
  });

  it("matches only supported modal customId prefixes", () => {
    expect(vacPanelModalHandler.matches("vac:rename-modal:voice-1")).toBe(true);
    expect(vacPanelModalHandler.matches("vac:limit-modal:voice-1")).toBe(true);
    expect(vacPanelModalHandler.matches("other:voice-1")).toBe(false);
  });

  it("replies error when target channel is not managed by VAC", async () => {
    isManagedVacChannelMock.mockResolvedValueOnce(false);
    const interaction = createBaseInteraction();

    await vacPanelModalHandler.execute(interaction as never);

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.not_vac_channel" }],
      flags: 64,
    });
  });

  // 入力値の前後空白をトリムして channel.edit に渡し、成功メッセージを返すことを検証
  it("renames voice channel and replies success", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createBaseInteraction({
      customId: "vac:rename-modal:voice-1",
      channel: { id: "voice-1", type: 2, edit: editMock },
      renameInput: " New Name ",
    });

    await vacPanelModalHandler.execute(interaction as never);

    expect(editMock).toHaveBeenCalledWith({ name: "New Name" });
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "renamed:New Name" }],
      flags: 64,
    });
  });

  // 数値に変換できない入力（"abc"）ではチャンネル編集を行わずバリデーションエラーを返すことを検証
  it("replies range error when limit input is invalid", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createBaseInteraction({
      customId: "vac:limit-modal:voice-1",
      channel: { id: "voice-1", type: 2, edit: editMock },
      limitInput: "abc",
    });

    await vacPanelModalHandler.execute(interaction as never);

    expect(editMock).not.toHaveBeenCalled();
    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "errors:vac.limit_out_of_range" }],
      flags: 64,
    });
  });
});
