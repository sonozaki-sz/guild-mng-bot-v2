/**
 * CooldownManager Unit Tests
 * コマンドクールダウン管理のテスト
 */

import { CooldownManager } from "@/bot/services/cooldownManager";
import { logger } from "@/shared/utils/logger";

// Logger のモック
vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// i18n のモック
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string, params?: Record<string, unknown>) =>
    `${key}:${JSON.stringify(params || {})}`,
}));

describe("CooldownManager", () => {
  // クールダウン登録・解除・統計・クリーンアップ挙動を検証
  let cooldownManager: CooldownManager;

  // 各テストで新しいインスタンスを作り、モック履歴を初期化
  beforeEach(() => {
    // 実時間待機を排除してテストを安定化
    vi.useFakeTimers();
    cooldownManager = new CooldownManager();
    vi.clearAllMocks();
  });

  // テスト後にインスタンス破棄とタイマー掃除を実施
  afterEach(() => {
    if (cooldownManager) {
      cooldownManager.destroy();
    }
    // すべてのタイマーをクリア
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  afterAll(() => {
    // テストスイート終了時に残っているタイマーをクリア
    vi.clearAllTimers();
  });

  describe("check()", () => {
    it("should return 0 when no cooldown is active", () => {
      const remaining = cooldownManager.check("testCommand", "user123", 10);
      expect(remaining).toBe(0);
    });

    it("should return remaining time when cooldown is active", () => {
      // 先に実行してクールダウン状態を作る
      cooldownManager.check("testCommand", "user123", 5);

      // 1秒経過させて残り時間を確認
      vi.advanceTimersByTime(1000);

      const remaining = cooldownManager.check("testCommand", "user123", 5);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(4);
    });

    it("should allow command after cooldown expires", () => {
      cooldownManager.check("testCommand", "user123", 1);

      // クールダウン期間 + バッファ分を進める
      vi.advanceTimersByTime(1100);

      const remaining = cooldownManager.check("testCommand", "user123", 1);
      expect(remaining).toBe(0);
    });

    it("should handle multiple users independently", () => {
      // ユーザーごとに独立したクールダウンであること
      cooldownManager.check("testCommand", "user1", 10);
      cooldownManager.check("testCommand", "user2", 10);

      const remaining1 = cooldownManager.check("testCommand", "user1", 10);
      const remaining2 = cooldownManager.check("testCommand", "user2", 10);

      expect(remaining1).toBeGreaterThan(0);
      expect(remaining2).toBeGreaterThan(0);
    });

    it("should handle multiple commands independently", () => {
      // コマンドごとに独立したクールダウンであること
      cooldownManager.check("command1", "user123", 10);
      cooldownManager.check("command2", "user123", 10);

      const remaining1 = cooldownManager.check("command1", "user123", 10);
      const remaining2 = cooldownManager.check("command2", "user123", 10);

      expect(remaining1).toBeGreaterThan(0);
      expect(remaining2).toBeGreaterThan(0);
    });

    it("should clear existing timer when resetting cooldown entry", () => {
      cooldownManager.check("testCommand", "user123", 0);

      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      cooldownManager.check("testCommand", "user123", 0);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should keep newer cooldown when stale timer callback runs", () => {
      cooldownManager.check("testCommand", "user123", 1);

      const managerInternals = cooldownManager as unknown as {
        cooldowns: Map<string, Map<string, number>>;
      };
      managerInternals.cooldowns
        .get("testCommand")
        ?.set("user123", Date.now() + 60_000);

      vi.advanceTimersByTime(1100);

      const stats = cooldownManager.getStats();
      expect(stats.totalCommands).toBe(1);
      expect(stats.totalUsers).toBe(1);
    });
  });

  describe("reset()", () => {
    it("should reset cooldown for specific user", () => {
      cooldownManager.check("testCommand", "user123", 10);

      cooldownManager.reset("testCommand", "user123");

      const remaining = cooldownManager.check("testCommand", "user123", 10);
      expect(remaining).toBe(0);
    });

    it("should not affect other users' cooldowns", () => {
      // 指定ユーザーのみ解除し、他ユーザーは維持されること
      cooldownManager.check("testCommand", "user1", 10);
      cooldownManager.check("testCommand", "user2", 10);

      cooldownManager.reset("testCommand", "user1");

      const remaining1 = cooldownManager.check("testCommand", "user1", 10);
      const remaining2 = cooldownManager.check("testCommand", "user2", 10);

      expect(remaining1).toBe(0);
      expect(remaining2).toBeGreaterThan(0);
    });

    it("should handle reset when timer does not exist", () => {
      expect(() => cooldownManager.reset("unknown", "user123")).not.toThrow();
    });
  });

  describe("clearCommand()", () => {
    it("should clear all cooldowns for a command", () => {
      cooldownManager.check("testCommand", "user1", 10);
      cooldownManager.check("testCommand", "user2", 10);
      cooldownManager.check("testCommand", "user3", 10);

      cooldownManager.clearCommand("testCommand");

      expect(cooldownManager.check("testCommand", "user1", 10)).toBe(0);
      expect(cooldownManager.check("testCommand", "user2", 10)).toBe(0);
      expect(cooldownManager.check("testCommand", "user3", 10)).toBe(0);
    });

    it("should not affect other commands", () => {
      cooldownManager.check("command1", "user123", 10);
      cooldownManager.check("command2", "user123", 10);

      cooldownManager.clearCommand("command1");

      expect(cooldownManager.check("command1", "user123", 10)).toBe(0);
      expect(cooldownManager.check("command2", "user123", 10)).toBeGreaterThan(
        0,
      );
    });

    it("should handle clearCommand when timer map does not exist", () => {
      expect(() => cooldownManager.clearCommand("unknown")).not.toThrow();
    });
  });

  describe("clearAll()", () => {
    it("should clear all cooldowns", () => {
      cooldownManager.check("command1", "user1", 10);
      cooldownManager.check("command1", "user2", 10);
      cooldownManager.check("command2", "user1", 10);

      cooldownManager.clearAll();

      expect(cooldownManager.check("command1", "user1", 10)).toBe(0);
      expect(cooldownManager.check("command1", "user2", 10)).toBe(0);
      expect(cooldownManager.check("command2", "user1", 10)).toBe(0);
    });
  });

  describe("cleanup()", () => {
    it("should remove expired cooldowns", () => {
      // 短期/長期を混在させ、期限切れのみ削除されることを確認
      cooldownManager.check("testCommand", "user1", 1);
      cooldownManager.check("testCommand", "user2", 10);

      // 短いクールダウンのみ期限切れにする
      vi.advanceTimersByTime(1100);

      cooldownManager.cleanup();

      const stats = cooldownManager.getStats();
      expect(stats.totalUsers).toBe(1); // user2 のみ残る
    });

    it("should handle empty cooldowns gracefully", () => {
      cooldownManager.cleanup();
      const stats = cooldownManager.getStats();
      expect(stats.totalCommands).toBe(0);
      expect(stats.totalUsers).toBe(0);
    });

    it("should delete expired entries, remove empty command map, and log cleanup count", () => {
      const managerInternals = cooldownManager as unknown as {
        cooldowns: Map<string, Map<string, number>>;
      };
      managerInternals.cooldowns.set(
        "expiredCommand",
        new Map([["expiredUser", Date.now() - 1000]]),
      );

      cooldownManager.cleanup();

      const stats = cooldownManager.getStats();
      expect(stats.totalCommands).toBe(0);
      expect(stats.totalUsers).toBe(0);
      expect(logger.debug).toHaveBeenCalledWith(
        'system:cooldown.cleanup:{"count":1}',
      );
    });
  });

  describe("getStats()", () => {
    it("should return correct stats", () => {
      cooldownManager.check("command1", "user1", 10);
      cooldownManager.check("command1", "user2", 10);
      cooldownManager.check("command2", "user1", 10);

      const stats = cooldownManager.getStats();
      expect(stats.totalCommands).toBe(2);
      expect(stats.totalUsers).toBe(3);
    });

    it("should return zero stats when empty", () => {
      const stats = cooldownManager.getStats();
      expect(stats.totalCommands).toBe(0);
      expect(stats.totalUsers).toBe(0);
    });
  });

  describe("destroy()", () => {
    it("should clear all cooldowns and stop cleanup interval", () => {
      // destroy 呼び出しで内部状態が完全にクリアされること
      cooldownManager.check("testCommand", "user123", 10);

      cooldownManager.destroy();

      const stats = cooldownManager.getStats();
      expect(stats.totalCommands).toBe(0);
      expect(stats.totalUsers).toBe(0);
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should automatically remove expired cooldowns", () => {
      cooldownManager.check("testCommand", "user123", 1);

      const initialStats = cooldownManager.getStats();
      expect(initialStats.totalUsers).toBe(1);

      // クールダウン期限 + バッファ分を進める
      vi.advanceTimersByTime(1100);

      const finalStats = cooldownManager.getStats();
      expect(finalStats.totalUsers).toBe(0);
    });

    it("should invoke cleanup via periodic interval callback", () => {
      const cleanupSpy = vi.spyOn(cooldownManager, "cleanup");

      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});
