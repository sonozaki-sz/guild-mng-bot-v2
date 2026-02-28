// tests/unit/bot/features/message-delete/repositories/messageDeleteUserSettingRepository.test.ts

import type { Mock } from "vitest";

const executeWithDatabaseErrorMock: Mock = vi.fn(async (fn: () => unknown) =>
  fn(),
);

vi.mock("@/shared/utils/errorHandling", () => ({
  executeWithDatabaseError: executeWithDatabaseErrorMock,
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
}));

// ──────────────────────────────────────
// テスト共通ヘルパー
// ──────────────────────────────────────

function createPrismaMock() {
  return {
    messageDeleteUserSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

// シングルトンキャッシュをテスト間でリセットするため動的インポートを使用
async function loadModule() {
  const mod =
    await import("@/bot/features/message-delete/repositories/messageDeleteUserSettingRepository");
  return mod;
}

// ──────────────────────────────────────
// テスト本体
// ──────────────────────────────────────

// MessageDeleteUserSettingRepository の CRUD デリゲートと
// getMessageDeleteUserSettingRepository のシングルトン挙動を検証
describe("bot/features/message-delete/repositories/messageDeleteUserSettingRepository", () => {
  // シングルトンキャッシュとモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    executeWithDatabaseErrorMock.mockImplementation(async (fn: () => unknown) =>
      fn(),
    );
  });

  // findByUserAndGuild が正しい where 条件で prisma.findUnique を呼び出すことを検証
  describe("MessageDeleteUserSettingRepository.findByUserAndGuild", () => {
    it("should delegate to prisma.messageDeleteUserSetting.findUnique with composite key", async () => {
      const prisma = createPrismaMock();
      const expected = { userId: "u1", guildId: "g1", skipConfirm: false };
      prisma.messageDeleteUserSetting.findUnique.mockResolvedValue(expected);

      const { MessageDeleteUserSettingRepository } = await loadModule();
      const repo = new MessageDeleteUserSettingRepository(prisma as never);
      const result = await repo.findByUserAndGuild("u1", "g1");

      expect(prisma.messageDeleteUserSetting.findUnique).toHaveBeenCalledWith({
        where: { userId_guildId: { userId: "u1", guildId: "g1" } },
      });
      expect(result).toBe(expected);
    });

    it("should return null when record is not found", async () => {
      const prisma = createPrismaMock();
      prisma.messageDeleteUserSetting.findUnique.mockResolvedValue(null);

      const { MessageDeleteUserSettingRepository } = await loadModule();
      const repo = new MessageDeleteUserSettingRepository(prisma as never);
      const result = await repo.findByUserAndGuild("u1", "g1");

      expect(result).toBeNull();
    });

    it("should forward error message from tDefault when executeWithDatabaseError is called", async () => {
      const prisma = createPrismaMock();
      prisma.messageDeleteUserSetting.findUnique.mockResolvedValue(null);

      const { MessageDeleteUserSettingRepository } = await loadModule();
      const repo = new MessageDeleteUserSettingRepository(prisma as never);
      await repo.findByUserAndGuild("u1", "g1");

      expect(executeWithDatabaseErrorMock).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(String),
      );
    });
  });

  // upsert が skipConfirm を含む正しいペイロードで prisma.upsert を呼び出すことを検証
  describe("MessageDeleteUserSettingRepository.upsert", () => {
    it("should delegate to prisma.upsert with create and update payloads", async () => {
      const prisma = createPrismaMock();
      const expected = { userId: "u1", guildId: "g1", skipConfirm: true };
      prisma.messageDeleteUserSetting.upsert.mockResolvedValue(expected);

      const { MessageDeleteUserSettingRepository } = await loadModule();
      const repo = new MessageDeleteUserSettingRepository(prisma as never);
      const result = await repo.upsert("u1", "g1", { skipConfirm: true });

      expect(prisma.messageDeleteUserSetting.upsert).toHaveBeenCalledWith({
        where: { userId_guildId: { userId: "u1", guildId: "g1" } },
        create: { userId: "u1", guildId: "g1", skipConfirm: true },
        update: { skipConfirm: true },
      });
      expect(result).toBe(expected);
    });

    it("should upsert with skipConfirm false", async () => {
      const prisma = createPrismaMock();
      prisma.messageDeleteUserSetting.upsert.mockResolvedValue({
        userId: "u2",
        guildId: "g2",
        skipConfirm: false,
      });

      const { MessageDeleteUserSettingRepository } = await loadModule();
      const repo = new MessageDeleteUserSettingRepository(prisma as never);
      await repo.upsert("u2", "g2", { skipConfirm: false });

      expect(prisma.messageDeleteUserSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ skipConfirm: false }),
          update: { skipConfirm: false },
        }),
      );
    });
  });

  // getMessageDeleteUserSettingRepository のシングルトン挙動を検証
  describe("getMessageDeleteUserSettingRepository", () => {
    it("should return the same instance on consecutive calls", async () => {
      const prisma = createPrismaMock();
      const {
        getMessageDeleteUserSettingRepository,
        MessageDeleteUserSettingRepository,
      } = await loadModule();

      const repo1 = getMessageDeleteUserSettingRepository(prisma as never);
      const repo2 = getMessageDeleteUserSettingRepository(prisma as never);

      expect(repo1).toBe(repo2);
      expect(repo1).toBeInstanceOf(MessageDeleteUserSettingRepository);
    });

    it("should create a new instance after module reset", async () => {
      const prisma = createPrismaMock();
      const { getMessageDeleteUserSettingRepository: get1 } =
        await loadModule();
      const repo1 = get1(prisma as never);

      // モジュールリセットでシングルトンを破棄
      vi.resetModules();
      const { getMessageDeleteUserSettingRepository: get2 } =
        await loadModule();
      const repo2 = get2(prisma as never);

      expect(repo1).not.toBe(repo2);
    });
  });
});
