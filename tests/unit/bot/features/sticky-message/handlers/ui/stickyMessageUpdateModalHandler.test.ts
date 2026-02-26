// tests/unit/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler.test.ts

import { MessageFlags } from "discord.js";

const findByChannelMock = vi.fn();
const updateContentMock = vi.fn();
const updateLastMessageIdMock = vi.fn();
const buildPayloadMock = vi.fn(() => ({ content: "sticky" }));
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
  () => ({ buildStickyMessagePayload: buildPayloadMock }),
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
  customId = "sticky-message:update-modal:ch-1",
  contentValue = "Updated content",
  channelInCache = true,
  lastMessageId = "old-msg-id" as string | undefined,
  sendResult = { id: "new-msg-id" },
  fetchSuccess = true,
}: {
  guild?: boolean;
  customId?: string;
  contentValue?: string;
  channelInCache?: boolean;
  lastMessageId?: string | undefined;
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
  return {
    customId,
    reply: replyMock,
    guild: guild
      ? {
          id: "guild-1",
          channels: { cache: new Map([["ch-1", textChannel]]) },
        }
      : null,
    fields: { getTextInputValue: vi.fn(() => contentValue) },
    user: { id: "user-1" },
    _replyMock: replyMock,
    _sendMock: sendMock,
    _deleteMock: deleteMock,
    _fetchMsgMock: fetchMsgMock,
  };
}

// モーダル送信時にスティッキーメッセージの内容を更新し、Discord上の投稿を差し替える一連のフローを検証する
describe("bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler", () => {
  // 各テストが独立して動くよう、モックの呼び出し履歴をリセットし updateContent の成功レスポンスを初期化する
  beforeEach(() => {
    vi.clearAllMocks();
    updateContentMock.mockResolvedValue({
      id: "sticky-1",
      content: "Updated content",
    });
    updateLastMessageIdMock.mockResolvedValue(undefined);
  });

  it("matches UPDATE_MODAL_ID_PREFIX", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    expect(
      stickyMessageUpdateModalHandler.matches(
        "sticky-message:update-modal:ch-1",
      ),
    ).toBe(true);
    expect(
      stickyMessageUpdateModalHandler.matches(
        "sticky-message:update-embed-modal:ch-1",
      ),
    ).toBe(false);
  });

  it("returns early when no guild", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    const interaction = createInteractionMock({ guild: false });

    await stickyMessageUpdateModalHandler.execute(interaction as never);

    expect(interaction._replyMock).not.toHaveBeenCalled();
  });

  it("replies with warning when content is empty", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    const interaction = createInteractionMock({ contentValue: "  " });

    await stickyMessageUpdateModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(updateContentMock).not.toHaveBeenCalled();
  });

  it("replies with info when sticky not found", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock();

    await stickyMessageUpdateModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(updateContentMock).not.toHaveBeenCalled();
  });

  // DB更新→旧メッセージ削除→新メッセージ送信という正常系の連鎖フロー全体が正しく実行されることを確認する
  it("updates content and resends sticky message when channel and lastMessageId exist", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "old-msg-id",
    });
    const interaction = createInteractionMock();

    await stickyMessageUpdateModalHandler.execute(interaction as never);

    expect(updateContentMock).toHaveBeenCalledWith(
      "sticky-1",
      "Updated content",
      null,
      "user-1",
    );
    expect(interaction._fetchMsgMock).toHaveBeenCalledWith("old-msg-id");
    expect(interaction._deleteMock).toHaveBeenCalled();
    expect(interaction._sendMock).toHaveBeenCalled();
    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  // 旧メッセージの取得・削除に失敗しても例外を握りつぶして後続処理（返信）が完了することを確認する
  it("ignores error when deleting old message fails", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "old-msg-id",
    });
    const interaction = createInteractionMock({ fetchSuccess: false });

    await expect(
      stickyMessageUpdateModalHandler.execute(interaction as never),
    ).resolves.not.toThrow();
    expect(interaction._replyMock).toHaveBeenCalled();
  });

  // DB更新は成功したがDiscordへの再送信が失敗した場合に、エラーがログに記録されることを確認する
  it("logs error when resend fails after update", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "old-msg-id",
    });
    const interaction = createInteractionMock({
      sendResult: undefined,
    });
    interaction._sendMock.mockRejectedValue(new Error("Send failed"));

    await stickyMessageUpdateModalHandler.execute(interaction as never);

    expect(loggerMock.error).toHaveBeenCalledWith(
      "Failed to resend sticky message after update",
      expect.any(Object),
    );
  });

  it("skips resend when no channel in cache", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "old-msg-id",
    });
    const interaction = createInteractionMock({ channelInCache: false });

    await stickyMessageUpdateModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalled();
  });

  // updateContent でDBエラーが発生した場合に例外が上位へ伝播し、かつエラーログが記録されることを確認する
  it("rethrows error when updateContent fails", async () => {
    const { stickyMessageUpdateModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: null,
    });
    updateContentMock.mockRejectedValue(new Error("DB error"));
    const interaction = createInteractionMock({ lastMessageId: undefined });

    await expect(
      stickyMessageUpdateModalHandler.execute(interaction as never),
    ).rejects.toThrow("DB error");
    expect(loggerMock.error).toHaveBeenCalled();
  });
});
