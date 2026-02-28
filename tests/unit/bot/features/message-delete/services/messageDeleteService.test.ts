// tests/unit/bot/features/message-delete/services/messageDeleteService.test.ts

import { PermissionFlagsBits } from "discord.js";

const loggerDebugMock = vi.fn();
const loggerWarnMock = vi.fn();

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    warn: (...args: unknown[]) => loggerWarnMock(...args),
  },
}));

// ──────────────────────────────────────
// テスト共通ヘルパー
// ──────────────────────────────────────

type MockMessage = {
  id: string;
  author: { id: string; tag: string; bot: boolean };
  content: string;
  createdTimestamp: number;
  createdAt: Date;
  delete: ReturnType<typeof vi.fn>;
};

function createMsg(
  overrides: Partial<{
    id: string;
    authorId: string;
    authorTag: string;
    authorBot: boolean;
    content: string;
    createdTimestamp: number;
  }> = {},
): MockMessage {
  const ts = overrides.createdTimestamp ?? Date.now();
  return {
    id: overrides.id ?? "msg-1",
    author: {
      id: overrides.authorId ?? "user-1",
      tag: overrides.authorTag ?? "user#0001",
      bot: overrides.authorBot ?? false,
    },
    content: overrides.content ?? "hello",
    createdTimestamp: ts,
    createdAt: new Date(ts),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

/** Channel.messages.fetch が返すコレクション形状を模倣する */
function makeBatch(messages: MockMessage[]) {
  return {
    size: messages.length,
    values: () => messages[Symbol.iterator](),
    last: () => messages[messages.length - 1],
  };
}

type MockChannel = {
  id: string;
  name: string;
  guild: { members: { me: { id: string } | null } };
  permissionsFor: ReturnType<typeof vi.fn>;
  messages: { fetch: ReturnType<typeof vi.fn> };
  bulkDelete: ReturnType<typeof vi.fn>;
};

function createChannel(opts: {
  id?: string;
  name?: string;
  /** null にすると権限チェックをスキップ */
  me?: { id: string } | null;
  /** permissionsFor(...).has(...) の戻り値 */
  hasPermission?: boolean;
  /** fetch 呼び出し毎に返すバッチ配列 */
  batches?: MockMessage[][];
}): MockChannel {
  const me = opts.me === undefined ? { id: "bot" } : opts.me;
  const hasPermission = opts.hasPermission ?? true;
  const batches = opts.batches ?? [[]];
  let batchIndex = 0;

  const fetchMock = vi.fn().mockImplementation(() => {
    const batch = batches[batchIndex] ?? [];
    batchIndex++;
    return Promise.resolve(makeBatch(batch));
  });

  return {
    id: opts.id ?? "ch-1",
    name: opts.name ?? "general",
    guild: { members: { me } },
    permissionsFor: vi
      .fn()
      .mockReturnValue({ has: vi.fn().mockReturnValue(hasPermission) }),
    messages: { fetch: fetchMock },
    bulkDelete: vi.fn().mockResolvedValue(undefined),
  };
}

// ──────────────────────────────────────
// テスト本体
// ──────────────────────────────────────

// deleteMessages のコアロジック（収集・削除・フィルタ・進捗）と parseDateStr を検証
describe("bot/features/message-delete/services/messageDeleteService", () => {
  // 各ケースでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 偽タイマーを実タイマーに戻して後続テストへの影響を防ぐ
  afterEach(() => {
    vi.useRealTimers();
  });

  async function loadModule() {
    const mod =
      await import("@/bot/features/message-delete/services/messageDeleteService");
    return mod;
  }

  // parseDateStr の入力パターンを検証
  describe("parseDateStr", () => {
    it("should normalize YYYY-MM-DD to 00:00:00 when endOfDay is false", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2026-01-15", false);
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toBe("2026-01-15T00:00:00.000Z");
    });

    it("should normalize YYYY-MM-DD to 23:59:59 when endOfDay is true", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2026-01-15", true);
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toBe("2026-01-15T23:59:59.000Z");
    });

    it("should parse full ISO datetime string as-is", async () => {
      const { parseDateStr } = await loadModule();
      const result = parseDateStr("2026-01-15T12:30:00", false);
      expect(result).not.toBeNull();
      expect(result!.getUTCHours()).toBe(12);
    });

    it("should return null for invalid date string", async () => {
      const { parseDateStr } = await loadModule();
      expect(parseDateStr("not-a-date", false)).toBeNull();
      expect(parseDateStr("", false)).toBeNull();
    });
  });

  // deleteMessages の各フローを検証
  describe("deleteMessages", () => {
    it("should return empty result when channels array is empty", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const promise = deleteMessages([], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(0);
      expect(result.channelBreakdown).toEqual({});
      expect(result.deletedRecords).toEqual([]);
    });

    // me が存在し has() が false の場合、チャンネルがスキップされることを確認
    it("should skip channel when bot lacks permission", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const channel = createChannel({
        hasPermission: false,
        batches: [[createMsg()]],
      });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(0);
      expect(channel.messages.fetch).not.toHaveBeenCalled();
    });

    // me が null のときは権限チェックなしでメッセージを処理することを確認
    it("should process channel when me is null (no permission check)", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msg = createMsg({ createdTimestamp: now });
      const channel = createChannel({ me: null, batches: [[msg], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(1);
    });

    it("should return 0 deleted when batch is empty on first fetch", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const channel = createChannel({ batches: [[]] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(0);
      expect(result.channelBreakdown).toEqual({});
    });

    it("should bulk delete new messages (within 14 days)", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msgs = [
        createMsg({ id: "m1", createdTimestamp: now }),
        createMsg({ id: "m2", createdTimestamp: now - 1000 }),
      ];
      const channel = createChannel({ batches: [msgs, []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(channel.bulkDelete).toHaveBeenCalledTimes(1);
      expect(result.totalDeleted).toBe(2);
      expect(result.channelBreakdown["general"]).toBe(2);
      expect(result.deletedRecords).toHaveLength(2);
    });

    it("should individually delete old messages (older than 14 days)", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const oldTs = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15日前
      const msg = createMsg({ id: "old-1", createdTimestamp: oldTs });
      const channel = createChannel({ batches: [[msg], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(msg.delete).toHaveBeenCalledTimes(1);
      expect(channel.bulkDelete).not.toHaveBeenCalled();
      expect(result.totalDeleted).toBe(1);
      expect(result.deletedRecords).toHaveLength(1);
    });

    // 個別削除が失敗した場合に logger.warn が呼ばれ、カウントに含まれないことを確認
    it("should log warning and skip count when individual delete fails", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const oldTs = Date.now() - 15 * 24 * 60 * 60 * 1000;
      const msg = createMsg({ id: "fail-1", createdTimestamp: oldTs });
      msg.delete.mockRejectedValueOnce(new Error("Missing Permissions"));
      const channel = createChannel({ batches: [[msg], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(loggerWarnMock).toHaveBeenCalledWith(
        expect.stringContaining("削除失敗"),
        expect.any(String),
      );
      expect(result.totalDeleted).toBe(0);
      expect(result.deletedRecords).toHaveLength(0);
    });

    it("should filter messages by targetUserId", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msg1 = createMsg({
        id: "m1",
        authorId: "target",
        createdTimestamp: now,
      });
      const msg2 = createMsg({
        id: "m2",
        authorId: "other",
        createdTimestamp: now - 1000,
      });
      const channel = createChannel({ batches: [[msg1, msg2], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        targetUserId: "target",
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(1);
      expect(result.deletedRecords[0].authorId).toBe("target");
    });

    it("should filter only bot messages when targetBot is true", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const botMsg = createMsg({
        id: "m1",
        authorBot: true,
        createdTimestamp: now,
      });
      const humanMsg = createMsg({
        id: "m2",
        authorBot: false,
        createdTimestamp: now - 1000,
      });
      const channel = createChannel({ batches: [[botMsg, humanMsg], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        targetBot: true,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(1);
      expect(result.deletedRecords[0].authorId).toBe("user-1");
    });

    it("should filter messages by keyword (case-insensitive)", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const match = createMsg({
        id: "m1",
        content: "Hello World",
        createdTimestamp: now,
      });
      const noMatch = createMsg({
        id: "m2",
        content: "goodbye",
        createdTimestamp: now - 1000,
      });
      const channel = createChannel({ batches: [[match, noMatch], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        keyword: "hello",
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(1);
      expect(result.deletedRecords[0].content).toBe("Hello World");
    });

    it("should filter out messages before afterTs", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const afterTs = now - 5000;
      const inRange = createMsg({ id: "m1", createdTimestamp: now - 1000 });
      const outOfRange = createMsg({ id: "m2", createdTimestamp: now - 10000 });
      const channel = createChannel({ batches: [[inRange, outOfRange], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(1);
      expect(result.deletedRecords[0].channelName).toBe("general");
    });

    // batchOldestTs < afterTs のとき、それ以前のメッセージはないと判断してループを打ち切ることを確認
    it("should break early when oldest message in batch is before afterTs", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const afterTs = now - 3000;
      // バッチの最古が afterTs よりも古い
      const msg = createMsg({ id: "m1", createdTimestamp: now - 10000 });
      const channel = createChannel({ batches: [[msg]] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      // msg は afterTs よりも古いので収集されない
      expect(result.totalDeleted).toBe(0);
      // fetch は1回だけ呼ばれ、早期終了している
      expect(channel.messages.fetch).toHaveBeenCalledTimes(1);
    });

    it("should filter out messages after beforeTs", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const beforeTs = now - 2000;
      const inRange = createMsg({ id: "m1", createdTimestamp: now - 5000 });
      const outOfRange = createMsg({ id: "m2", createdTimestamp: now - 1000 });
      const channel = createChannel({ batches: [[inRange, outOfRange], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(1);
    });

    it("should stop collecting when count limit is reached", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msgs = Array.from({ length: 5 }, (_, i) =>
        createMsg({ id: `m${i}`, createdTimestamp: now - i * 100 }),
      );
      const channel = createChannel({ batches: [msgs] });
      const promise = deleteMessages([channel as never], {
        count: 2,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(2);
    });

    // バッチサイズが MSG_DEL_FETCH_BATCH_SIZE 未満のとき、ループが打ち切られることを確認
    it("should stop fetching when batch is smaller than fetch batch size", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      // 99件（100未満）なのでループ打ち切り
      const msgs = Array.from({ length: 99 }, (_, i) =>
        createMsg({ id: `m${i}`, createdTimestamp: now - i }),
      );
      const channel = createChannel({ batches: [msgs] });
      const promise = deleteMessages([channel as never], {
        count: 200,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(channel.messages.fetch).toHaveBeenCalledTimes(1);
      expect(result.totalDeleted).toBe(99);
    });

    // 複数バッチ取得で lastId が設定され、2回目以降のfetchに before が渡されることを確認
    it("should pass lastId as before option on subsequent fetches", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      // 1バッチ目: 100件（ループ継続）
      const batch1 = Array.from({ length: 100 }, (_, i) =>
        createMsg({ id: `m${i}`, createdTimestamp: now - i }),
      );
      // 2バッチ目: 空（ループ終了）
      const channel = createChannel({ batches: [batch1, []] });
      const promise = deleteMessages([channel as never], {
        count: 200,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      await promise;

      expect(channel.messages.fetch).toHaveBeenCalledTimes(2);
      // 2回目は before: lastId が含まれる
      expect(channel.messages.fetch).toHaveBeenNthCalledWith(2, {
        limit: 100,
        before: expect.any(String),
      });
    });

    it("should truncate content exceeding 200 characters", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const longContent = "a".repeat(250);
      const msg = createMsg({ createdTimestamp: now, content: longContent });
      const channel = createChannel({ batches: [[msg], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.deletedRecords[0].content.endsWith("…")).toBe(true);
      expect(result.deletedRecords[0].content.length).toBe(201); // 200 chars + "…"
    });

    it("should not truncate content within 200 characters", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msg = createMsg({ createdTimestamp: now, content: "short" });
      const channel = createChannel({ batches: [[msg], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.deletedRecords[0].content).toBe("short");
    });

    // 複数チャンネルを処理し、channelBreakdown に各チャンネルの削除件数が記録されることを確認
    it("should process multiple channels and record breakdown", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msg1 = createMsg({ id: "m1", createdTimestamp: now });
      const msg2 = createMsg({ id: "m2", createdTimestamp: now - 1000 });
      const ch1 = createChannel({
        id: "ch-1",
        name: "ch1",
        batches: [[msg1], []],
      });
      const ch2 = createChannel({
        id: "ch-2",
        name: "ch2",
        batches: [[msg2], []],
      });
      const promise = deleteMessages([ch1 as never, ch2 as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(2);
      expect(result.channelBreakdown["ch1"]).toBe(1);
      expect(result.channelBreakdown["ch2"]).toBe(1);
    });

    // 収集件数が 0 のチャンネルは channelBreakdown に含まれないことを確認
    it("should skip channel breakdown entry when collected is empty", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const channel = createChannel({ name: "empty-ch", batches: [[]] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.channelBreakdown["empty-ch"]).toBeUndefined();
    });

    it("should invoke onProgress callback during scan and delete", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msg = createMsg({ createdTimestamp: now });
      const channel = createChannel({ batches: [[msg], []] });
      const onProgress = vi.fn().mockResolvedValue(undefined);
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
        onProgress,
      });
      await vi.runAllTimersAsync();
      await promise;

      expect(onProgress).toHaveBeenCalled();
      const calls = onProgress.mock.calls.map((c) => c[0] as string);
      expect(calls.some((s) => s.includes("スキャン中"))).toBe(true);
      expect(calls.some((s) => s.includes("削除中"))).toBe(true);
    });

    // onProgress なしでは report が早期リターンし、エラーなく完了することを確認
    it("should complete without onProgress callback", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msg = createMsg({ createdTimestamp: now });
      const channel = createChannel({ batches: [[msg], []] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
        // onProgress は未指定
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.totalDeleted).toBe(1);
    });

    // 101件以上の新しいメッセージを処理して bulkDelete バッチ間の sleep が実行されることを確認
    it("should sleep between bulk delete batches when newMsgs exceed batch size", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      // 101件の新メッセージ → bulkDelete が2回に分かれる
      const msgs = Array.from({ length: 101 }, (_, i) =>
        createMsg({ id: `m${i}`, createdTimestamp: now - i }),
      );
      const channel = createChannel({ batches: [msgs, []] });
      const promise = deleteMessages([channel as never], {
        count: 200,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(channel.bulkDelete).toHaveBeenCalledTimes(2);
      expect(result.totalDeleted).toBe(101);
    });

    it("should record authorTag and channelName in deletedRecords", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const now = Date.now();
      const msg = createMsg({
        authorId: "uid-1",
        authorTag: "tester#1234",
        createdTimestamp: now,
      });
      const channel = createChannel({
        id: "cid",
        name: "mychannel",
        batches: [[msg], []],
      });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.deletedRecords[0].authorTag).toBe("tester#1234");
      expect(result.deletedRecords[0].channelId).toBe("cid");
      expect(result.deletedRecords[0].channelName).toBe("mychannel");
    });

    // 権限チェックが me の存在とperissionsFor を両方参照することを確認
    it("should call permissionsFor with me when checking permissions", async () => {
      const { deleteMessages } = await loadModule();
      vi.useFakeTimers();
      const me = { id: "bot" };
      const channel = createChannel({ me, hasPermission: true, batches: [[]] });
      const promise = deleteMessages([channel as never], {
        count: 10,
        afterTs: 0,
        beforeTs: Infinity,
      });
      await vi.runAllTimersAsync();
      await promise;

      expect(channel.permissionsFor).toHaveBeenCalledWith(me);
      expect(
        (
          channel.permissionsFor.mock.results[0].value as {
            has: ReturnType<typeof vi.fn>;
          }
        ).has,
      ).toHaveBeenCalledWith([
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ]);
    });
  });
});
