/**
 * CooldownManager Unit Tests
 * コマンドクールダウン管理のテスト
 */

import { CooldownManager } from "../../../src/bot/services/CooldownManager";

// Logger のモック
jest.mock("../../../src/shared/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// i18n のモック
jest.mock("../../../src/shared/locale", () => ({
  tDefault: (key: string, params?: Record<string, unknown>) =>
    `${key}:${JSON.stringify(params || {})}`,
}));

describe("CooldownManager", () => {
  let cooldownManager: CooldownManager;

  beforeEach(() => {
    cooldownManager = new CooldownManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (cooldownManager) {
      cooldownManager.destroy();
    }
    // すべてのタイマーをクリア
    jest.clearAllTimers();
  });

  afterAll(() => {
    // テストスイート終了時に残っているタイマーをクリア
    jest.clearAllTimers();
  });

  describe("check()", () => {
    it("should return 0 when no cooldown is active", () => {
      const remaining = cooldownManager.check("testCommand", "user123", 10);
      expect(remaining).toBe(0);
    });

    it("should return remaining time when cooldown is active", async () => {
      cooldownManager.check("testCommand", "user123", 5);

      // 少し待ってから再度チェック
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const remaining = cooldownManager.check("testCommand", "user123", 5);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(4);
    });

    it("should allow command after cooldown expires", async () => {
      cooldownManager.check("testCommand", "user123", 1);

      // クールダウン期間 + バッファを待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const remaining = cooldownManager.check("testCommand", "user123", 1);
      expect(remaining).toBe(0);
    });

    it("should handle multiple users independently", () => {
      cooldownManager.check("testCommand", "user1", 10);
      cooldownManager.check("testCommand", "user2", 10);

      const remaining1 = cooldownManager.check("testCommand", "user1", 10);
      const remaining2 = cooldownManager.check("testCommand", "user2", 10);

      expect(remaining1).toBeGreaterThan(0);
      expect(remaining2).toBeGreaterThan(0);
    });

    it("should handle multiple commands independently", () => {
      cooldownManager.check("command1", "user123", 10);
      cooldownManager.check("command2", "user123", 10);

      const remaining1 = cooldownManager.check("command1", "user123", 10);
      const remaining2 = cooldownManager.check("command2", "user123", 10);

      expect(remaining1).toBeGreaterThan(0);
      expect(remaining2).toBeGreaterThan(0);
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
      cooldownManager.check("testCommand", "user1", 10);
      cooldownManager.check("testCommand", "user2", 10);

      cooldownManager.reset("testCommand", "user1");

      const remaining1 = cooldownManager.check("testCommand", "user1", 10);
      const remaining2 = cooldownManager.check("testCommand", "user2", 10);

      expect(remaining1).toBe(0);
      expect(remaining2).toBeGreaterThan(0);
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
    it("should remove expired cooldowns", async () => {
      cooldownManager.check("testCommand", "user1", 1);
      cooldownManager.check("testCommand", "user2", 10);

      // 短いクールダウンの期限を待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

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
      cooldownManager.check("testCommand", "user123", 10);

      cooldownManager.destroy();

      const stats = cooldownManager.getStats();
      expect(stats.totalCommands).toBe(0);
      expect(stats.totalUsers).toBe(0);
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should automatically remove expired cooldowns", async () => {
      cooldownManager.check("testCommand", "user123", 1);

      const initialStats = cooldownManager.getStats();
      expect(initialStats.totalUsers).toBe(1);

      // クールダウン期限 + バッファを待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const finalStats = cooldownManager.getStats();
      expect(finalStats.totalUsers).toBe(0);
    });
  });
});
