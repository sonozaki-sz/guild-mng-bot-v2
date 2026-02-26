// tests/unit/bot/features/sticky-message/services/stickyMessageResendService.test.ts

import type { TextChannel } from "discord.js";

const buildPayloadMock = vi.fn(() => ({ content: "sticky content" }));
const loggerMock = { error: vi.fn(), debug: vi.fn(), info: vi.fn() };

vi.mock(
  "@/bot/features/sticky-message/services/stickyMessagePayloadBuilder",
  () => ({
    buildStickyMessagePayload: buildPayloadMock,
  }),
);
vi.mock("@/shared/utils/logger", () => ({ logger: loggerMock }));

function createChannelMock(
  overrides: Partial<{
    id: string;
    send: ReturnType<typeof vi.fn>;
    messages: { fetch: ReturnType<typeof vi.fn> };
  }> = {},
): TextChannel {
  return {
    id: "channel-1",
    send: vi.fn().mockResolvedValue({ id: "new-msg-id" }),
    messages: {
      fetch: vi.fn().mockResolvedValue({ delete: vi.fn() }),
    },
    ...overrides,
  } as unknown as TextChannel;
}

function createRepoMock() {
  return {
    findByChannel: vi.fn(),
    updateLastMessageId: vi.fn().mockResolvedValue(undefined),
    create: vi.fn(),
    findAllByGuild: vi.fn(),
    delete: vi.fn(),
    deleteByChannel: vi.fn(),
    updateContent: vi.fn(),
  };
}

// 5秒デバウンスタイマー・前メッセージ削除・エラー耐性・シングルトン管理を一通り検証
describe("bot/features/sticky-message/services/stickyMessageResendService", () => {
  // デバウンスタイマーを制御するために偽タイマーが必要。モジュールキャッシュも毎回クリアして独立性を保つ
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  // テスト後にシステム時計を本物に戻し、他テストのタイマー動作に影響させない
  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules a resend timer and fires after 5 seconds", async () => {
    const repo = createRepoMock();
    const sticky = {
      id: "sticky-1",
      channelId: "channel-1",
      content: "Hello",
      embedData: null,
      lastMessageId: null,
    };
    repo.findByChannel.mockResolvedValue(sticky);

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);
    const channel = createChannelMock({ id: "channel-1" });

    await service.handleMessageCreate(channel, "guild-1");

    expect(repo.findByChannel).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(repo.findByChannel).toHaveBeenCalledWith("channel-1");
    expect(channel.send).toHaveBeenCalledWith({ content: "sticky content" });
    expect(repo.updateLastMessageId).toHaveBeenCalledWith(
      "sticky-1",
      "new-msg-id",
    );
  });

  it("debounces multiple messages within 5 seconds", async () => {
    const repo = createRepoMock();
    const sticky = {
      id: "sticky-1",
      channelId: "channel-2",
      content: "World",
      embedData: null,
      lastMessageId: null,
    };
    repo.findByChannel.mockResolvedValue(sticky);

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);
    const channel = createChannelMock({ id: "channel-2" });

    await service.handleMessageCreate(channel, "guild-1");
    await service.handleMessageCreate(channel, "guild-1");
    await service.handleMessageCreate(channel, "guild-1");

    await vi.runAllTimersAsync();

    // Only one resend despite multiple events
    expect(repo.findByChannel).toHaveBeenCalledTimes(1);
  });

  it("deletes previous sticky message before sending new one", async () => {
    const repo = createRepoMock();
    const deleteMock = vi.fn();
    const fetchMessageMock = vi.fn().mockResolvedValue({ delete: deleteMock });
    const sticky = {
      id: "sticky-1",
      channelId: "channel-3",
      content: "Update",
      embedData: null,
      lastMessageId: "old-msg-id",
    };
    repo.findByChannel.mockResolvedValue(sticky);

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);
    const channel = createChannelMock({
      id: "channel-3",
      messages: { fetch: fetchMessageMock },
    });

    await service.handleMessageCreate(channel, "guild-1");
    await vi.runAllTimersAsync();

    expect(fetchMessageMock).toHaveBeenCalledWith("old-msg-id");
    expect(deleteMock).toHaveBeenCalled();
  });

  // 削除済みメッセージへの fetch が 404 エラーになるケース: サービスはクラッシュせず debug ログだけ出すべき
  it("ignores error when previous sticky message is already deleted", async () => {
    const repo = createRepoMock();
    const fetchMessageMock = vi.fn().mockRejectedValue(new Error("Not Found"));
    const sticky = {
      id: "sticky-1",
      channelId: "channel-4",
      content: "Test",
      embedData: null,
      lastMessageId: "gone-msg",
    };
    repo.findByChannel.mockResolvedValue(sticky);

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);
    const channel = createChannelMock({
      id: "channel-4",
      messages: { fetch: fetchMessageMock },
    });

    await service.handleMessageCreate(channel, "guild-1");

    // Should not throw
    await expect(vi.runAllTimersAsync()).resolves.not.toThrow();
    expect(loggerMock.debug).toHaveBeenCalled();
  });

  it("logs error when sending sticky message fails", async () => {
    const repo = createRepoMock();
    const sticky = {
      id: "sticky-1",
      channelId: "channel-5",
      content: "Test",
      embedData: null,
      lastMessageId: null,
    };
    repo.findByChannel.mockResolvedValue(sticky);

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);
    const channel = createChannelMock({
      id: "channel-5",
      send: vi.fn().mockRejectedValue(new Error("Send failed")),
    });

    await service.handleMessageCreate(channel, "guild-1");
    await vi.runAllTimersAsync();

    expect(loggerMock.error).toHaveBeenCalledWith(
      "Failed to send sticky message",
      expect.objectContaining({ channelId: "channel-5" }),
    );
  });

  it("returns early when no sticky message found for channel", async () => {
    const repo = createRepoMock();
    repo.findByChannel.mockResolvedValue(null);

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);
    const channel = createChannelMock({ id: "channel-6" });

    await service.handleMessageCreate(channel, "guild-1");
    await vi.runAllTimersAsync();

    expect(channel.send).not.toHaveBeenCalled();
  });

  // タイマー登録後に cancelTimer を呼ぶと、その後タイマーが発火しても resend が実行されないことを確認
  it("cancelTimer removes the scheduled timer", async () => {
    const repo = createRepoMock();
    const sticky = {
      id: "sticky-1",
      channelId: "channel-7",
      content: "Cancel test",
      embedData: null,
      lastMessageId: null,
    };
    repo.findByChannel.mockResolvedValue(sticky);

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);
    const channel = createChannelMock({ id: "channel-7" });

    await service.handleMessageCreate(channel, "guild-1");
    service.cancelTimer("channel-7");
    await vi.runAllTimersAsync();

    expect(repo.findByChannel).not.toHaveBeenCalled();
  });

  it("cancelTimer on channel with no timer does nothing", async () => {
    const repo = createRepoMock();

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);

    // Should not throw
    expect(() => service.cancelTimer("no-such-channel")).not.toThrow();
  });

  // 引数なしで呼ぶと「未初期化」エラーになる初期化ガードを検証
  it("getStickyMessageResendService throws when not initialized", async () => {
    const { getStickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");

    expect(() => getStickyMessageResendService()).toThrow(
      "StickyMessageResendService is not initialized",
    );
  });

  it("getStickyMessageResendService initializes and returns singleton", async () => {
    const repo = createRepoMock();
    const { getStickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");

    const service1 = getStickyMessageResendService(repo as never);
    const service2 = getStickyMessageResendService();

    expect(service1).toBe(service2);
  });

  it("logs scheduled error when resend rejects (catch callback coverage)", async () => {
    const repo = createRepoMock();
    // findByChannel throws to cause resend() itself to reject
    repo.findByChannel.mockRejectedValue(new Error("DB fatal error"));

    const { StickyMessageResendService } =
      await import("@/bot/features/sticky-message/services/stickyMessageResendService");
    const service = new StickyMessageResendService(repo as never);
    const channel = createChannelMock({ id: "channel-err" });

    await service.handleMessageCreate(channel, "guild-1");
    await vi.runAllTimersAsync();

    expect(loggerMock.error).toHaveBeenCalledWith(
      "StickyMessage resend scheduled error",
      expect.any(Error),
    );
  });
});
