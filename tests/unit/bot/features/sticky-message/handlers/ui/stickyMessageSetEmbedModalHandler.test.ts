// tests/unit/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler.test.ts

import { MessageFlags } from "discord.js";

const findByChannelMock = vi.fn();
const createMock = vi.fn();
const updateLastMessageIdMock = vi.fn();
const buildPayloadMock = vi.fn(() => ({ embeds: [] }));
const parseColorStrMock = vi.fn(() => 0x008969);
const tGuildMock = vi.fn(async (_guildId: string, key: string) => `[${key}]`);
const loggerMock = { error: vi.fn() };

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageConfigService: vi.fn(() => ({
    findByChannel: findByChannelMock,
    create: createMock,
    updateLastMessageId: updateLastMessageIdMock,
  })),
}));
vi.mock(
  "@/bot/features/sticky-message/services/stickyMessagePayloadBuilder",
  () => ({
    buildStickyMessagePayload: buildPayloadMock,
    parseColorStr: parseColorStrMock,
  }),
);
vi.mock("@/shared/locale/localeManager", () => ({ tGuild: tGuildMock, tDefault: vi.fn((key: string) => key) }));
vi.mock("@/shared/utils/logger", () => ({ logger: loggerMock }));
vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: vi.fn((msg: string) => ({ type: "warning", msg })),
  createSuccessEmbed: vi.fn((msg: string) => ({ type: "success", msg })),
}));

function createInteractionMock({
  guild = true,
  customId = "sticky-message:set-embed-modal:ch-1",
  embedTitle = "Title",
  embedDescription = "Description",
  embedColor = "#ff0000",
  channelInCache = true,
  sendResult = { id: "new-msg-id" },
}: {
  guild?: boolean;
  customId?: string;
  embedTitle?: string | null;
  embedDescription?: string | null;
  embedColor?: string | null;
  channelInCache?: boolean;
  sendResult?: unknown;
} = {}) {
  const replyMock = vi.fn().mockResolvedValue(undefined);
  const sendMock = vi.fn().mockResolvedValue(sendResult);
  const textChannel = channelInCache ? { send: sendMock } : null;
  return {
    customId,
    reply: replyMock,
    guild: guild
      ? {
          id: "guild-1",
          channels: { cache: new Map([["ch-1", textChannel]]) },
        }
      : null,
    fields: {
      getTextInputValue: vi.fn((fieldId: string) => {
        if (fieldId === "sticky-message:modal:embed-title")
          return embedTitle ?? "";
        if (fieldId === "sticky-message:modal:embed-description")
          return embedDescription ?? "";
        if (fieldId === "sticky-message:modal:embed-color")
          return embedColor ?? "";
        return "";
      }),
    },
    user: { id: "user-1" },
    _replyMock: replyMock,
    _sendMock: sendMock,
  };
}

// Embedスタイルのスティッキーメッセージをモーダルから新規作成する際の入力バリデーション・DB登録・Discord送信フローを検証する
describe("bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler", () => {
  // テスト間でモック状態を完全リセットし、createMockのデフォルト応答を設定して各ケースを独立させる
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue({ id: "sticky-1" });
    updateLastMessageIdMock.mockResolvedValue(undefined);
    parseColorStrMock.mockReturnValue(0x008969);
  });

  it("matches SET_EMBED_MODAL_ID_PREFIX", async () => {
    const { stickyMessageSetEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler");
    expect(
      stickyMessageSetEmbedModalHandler.matches(
        "sticky-message:set-embed-modal:ch-1",
      ),
    ).toBe(true);
    expect(
      stickyMessageSetEmbedModalHandler.matches(
        "sticky-message:set-modal:ch-1",
      ),
    ).toBe(false);
  });

  it("returns early when no guild", async () => {
    const { stickyMessageSetEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler");
    const interaction = createInteractionMock({ guild: false });

    await stickyMessageSetEmbedModalHandler.execute(interaction as never);

    expect(interaction._replyMock).not.toHaveBeenCalled();
  });

  it("replies with warning when both title and description are empty", async () => {
    const { stickyMessageSetEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler");
    const interaction = createInteractionMock({
      embedTitle: "",
      embedDescription: "",
    });

    await stickyMessageSetEmbedModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  // 対象チャンネルにすでにスティッキーメッセージが存在する場合、重複作成を防ぐガード処理が働くことを確認する
  it("replies with warning when sticky already exists", async () => {
    const { stickyMessageSetEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler");
    findByChannelMock.mockResolvedValue({ id: "existing" });
    const interaction = createInteractionMock();

    await stickyMessageSetEmbedModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  // Discordチャンネルキャッシュに対象チャンネルが存在しない場合、バリデーションエラーが上位へ伝播することを確認する
  it("throws ValidationError when channel not in cache", async () => {
    const { stickyMessageSetEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock({ channelInCache: false });

    await expect(
      stickyMessageSetEmbedModalHandler.execute(interaction as never),
    ).rejects.toThrow();
  });

  it("creates embed sticky and replies with success", async () => {
    const { stickyMessageSetEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock({
      embedTitle: "My Title",
      embedDescription: "My Description",
    });

    await stickyMessageSetEmbedModalHandler.execute(interaction as never);

    expect(createMock).toHaveBeenCalled();
    expect(interaction._sendMock).toHaveBeenCalled();
    expect(updateLastMessageIdMock).toHaveBeenCalledWith(
      "sticky-1",
      "new-msg-id",
    );
    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  // 説明文が空の場合、タイトルのみでcreateが呼ばれること（contentフォールバック）を確認する
  it("uses embedTitle as content when no description", async () => {
    const { stickyMessageSetEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock({
      embedTitle: "Only Title",
      embedDescription: "",
    });

    await stickyMessageSetEmbedModalHandler.execute(interaction as never);

    expect(createMock).toHaveBeenCalledWith(
      "guild-1",
      "ch-1",
      "Only Title",
      expect.any(String),
      "user-1",
    );
  });

  it("rethrows error when create fails", async () => {
    const { stickyMessageSetEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler");
    findByChannelMock.mockResolvedValue(null);
    createMock.mockRejectedValue(new Error("DB error"));
    const interaction = createInteractionMock();

    await expect(
      stickyMessageSetEmbedModalHandler.execute(interaction as never),
    ).rejects.toThrow("DB error");
    expect(loggerMock.error).toHaveBeenCalled();
  });
});
