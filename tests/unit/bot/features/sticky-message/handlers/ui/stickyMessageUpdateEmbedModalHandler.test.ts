// tests/unit/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler.test.ts

import { MessageFlags } from "discord.js";

const findByChannelMock = vi.fn();
const updateContentMock = vi.fn();
const updateLastMessageIdMock = vi.fn();
const buildPayloadMock = vi.fn(() => ({ embeds: [{ description: "sticky" }] }));
const parseColorStrMock = vi.fn((v: string | null) =>
  v === "#ff0000" ? 0xff0000 : undefined,
);
const tGuildMock = vi.fn(async (_guildId: string, key: string) => `[${key}]`);
const loggerMock = { error: vi.fn() };

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageConfigService: vi.fn(() => ({
    findByChannel: findByChannelMock,
    updateContent: updateContentMock,
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
vi.mock("@/shared/locale/localeManager", () => ({ tGuild: tGuildMock }));
vi.mock("@/shared/utils/logger", () => ({ logger: loggerMock }));
vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: vi.fn((msg: string) => ({ type: "warning", msg })),
  createInfoEmbed: vi.fn((msg: string) => ({ type: "info", msg })),
  createSuccessEmbed: vi.fn((msg: string) => ({ type: "success", msg })),
}));

function createInteractionMock({
  guild = true,
  customId = "sticky-message:update-embed-modal:ch-1",
  embedTitle = "My Title",
  embedDescription = "My Description",
  embedColor = "#ff0000",
  channelInCache = true,
  sendResult = { id: "new-msg-id" },
  fetchSuccess = true,
}: {
  guild?: boolean;
  customId?: string;
  embedTitle?: string;
  embedDescription?: string;
  embedColor?: string;
  channelInCache?: boolean;
  lastMessageId?: string | null;
  sendResult?: unknown;
  fetchSuccess?: boolean;
} = {}) {
  const replyMock = vi.fn().mockResolvedValue(undefined);
  const sendMock = vi.fn().mockResolvedValue(sendResult);
  const deleteMock = vi.fn().mockResolvedValue(undefined);
  const fetchMsgMock = fetchSuccess
    ? vi.fn().mockResolvedValue({ delete: deleteMock })
    : vi.fn().mockRejectedValue(new Error("Not found"));
  const textChannel = channelInCache
    ? { messages: { fetch: fetchMsgMock }, send: sendMock }
    : null;
  const inputValues: Record<string, string> = {
    "sticky-message:modal:embed-title": embedTitle,
    "sticky-message:modal:embed-description": embedDescription,
    "sticky-message:modal:embed-color": embedColor,
  };
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
      getTextInputValue: vi.fn((id: string) => inputValues[id] ?? ""),
    },
    user: { id: "user-1" },
    _replyMock: replyMock,
    _sendMock: sendMock,
    _deleteMock: deleteMock,
    _fetchMsgMock: fetchMsgMock,
  };
}

// Embed 更新モーダル送信時のバリデーション・DB 更新・メッセージ再送信フローを検証
describe("bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler", () => {
  // 各テストで独立したモック状態を保証し、前テストの呼び出し記録や戻り値を排除する
  beforeEach(() => {
    vi.clearAllMocks();
    updateContentMock.mockResolvedValue({
      id: "sticky-1",
      content: "My Description",
    });
    updateLastMessageIdMock.mockResolvedValue(undefined);
  });

  it("matches UPDATE_EMBED_MODAL_ID_PREFIX", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    expect(
      stickyMessageUpdateEmbedModalHandler.matches(
        "sticky-message:update-embed-modal:ch-1",
      ),
    ).toBe(true);
    expect(
      stickyMessageUpdateEmbedModalHandler.matches(
        "sticky-message:update-modal:ch-1",
      ),
    ).toBe(false);
  });

  it("returns early when no guild", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    const interaction = createInteractionMock({ guild: false });

    await stickyMessageUpdateEmbedModalHandler.execute(interaction as never);

    expect(interaction._replyMock).not.toHaveBeenCalled();
  });

  // バリデーション異常系: タイトルと説明が両方空の場合は DB 更新を行わず警告を Ephemeral 返信すること
  it("replies with warning when both title and description are empty", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    const interaction = createInteractionMock({
      embedTitle: "",
      embedDescription: "",
    });

    await stickyMessageUpdateEmbedModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(updateContentMock).not.toHaveBeenCalled();
  });

  it("replies with info when sticky not found", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock();

    await stickyMessageUpdateEmbedModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(updateContentMock).not.toHaveBeenCalled();
  });

  // 正常系: コンテンツ更新・旧メッセージ削除・新規送信・lastMessageId 更新が一連の順序で実行されること
  it("updates embed content and resends sticky message", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "old-msg-id",
    });
    const interaction = createInteractionMock();

    await stickyMessageUpdateEmbedModalHandler.execute(interaction as never);

    expect(updateContentMock).toHaveBeenCalledWith(
      "sticky-1",
      expect.any(String),
      expect.stringContaining("title"),
      "user-1",
    );
    expect(interaction._fetchMsgMock).toHaveBeenCalledWith("old-msg-id");
    expect(interaction._deleteMock).toHaveBeenCalled();
    expect(interaction._sendMock).toHaveBeenCalled();
    expect(updateLastMessageIdMock).toHaveBeenCalledWith(
      "sticky-1",
      "new-msg-id",
    );
    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  it("proceeds with only title when description is empty", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: null,
    });
    const interaction = createInteractionMock({ embedDescription: "" });

    await stickyMessageUpdateEmbedModalHandler.execute(interaction as never);

    expect(updateContentMock).toHaveBeenCalled();
    expect(interaction._replyMock).toHaveBeenCalled();
  });

  // 準正常系: 旧メッセージの取得・削除に失敗しても例外を伝播させず処理を続行すること
  it("ignores error when deleting old message fails", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "old-msg-id",
    });
    const interaction = createInteractionMock({ fetchSuccess: false });

    await expect(
      stickyMessageUpdateEmbedModalHandler.execute(interaction as never),
    ).resolves.not.toThrow();
    expect(interaction._replyMock).toHaveBeenCalled();
  });

  it("logs error when resend fails after update", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "old-msg-id",
    });
    const interaction = createInteractionMock();
    interaction._sendMock.mockRejectedValue(new Error("Send failed"));

    await stickyMessageUpdateEmbedModalHandler.execute(interaction as never);

    expect(loggerMock.error).toHaveBeenCalledWith(
      "Failed to resend sticky message after embed update",
      expect.any(Object),
    );
    expect(interaction._replyMock).toHaveBeenCalled();
  });

  it("skips resend when no channel in cache", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "old-msg-id",
    });
    const interaction = createInteractionMock({ channelInCache: false });

    await stickyMessageUpdateEmbedModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalled();
  });

  // 異常系: DB 書き込み失敗時はエラーをロギングしたうえで呼び出し元に再スローすること
  it("rethrows error when updateContent fails", async () => {
    const { stickyMessageUpdateEmbedModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: null,
    });
    updateContentMock.mockRejectedValue(new Error("DB error"));
    const interaction = createInteractionMock({
      channelInCache: false,
      lastMessageId: null,
    });

    await expect(
      stickyMessageUpdateEmbedModalHandler.execute(interaction as never),
    ).rejects.toThrow("DB error");
    expect(loggerMock.error).toHaveBeenCalled();
  });
});
