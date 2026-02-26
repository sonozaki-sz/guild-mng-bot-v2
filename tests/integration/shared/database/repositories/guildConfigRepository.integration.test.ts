// tests/integration/shared/database/repositories/guildConfigRepository.integration.test.ts
/**
 * GuildConfigRepository Integration Tests
 * Prisma Repositoryの統合テスト
 */

import { PrismaGuildConfigRepository } from "@/shared/database/repositories/guildConfigRepository";
import type { GuildConfig } from "@/shared/database/types";
import { DatabaseError } from "@/shared/errors/customErrors";

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
  tDefault: (key: string) => `mocked:${key}`,
}));

// Prismaクライアントのモック
const mockPrismaClient = {
  guildConfig: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

describe("PrismaGuildConfigRepository", () => {
  // ギルド設定の取得・保存・CAS更新・機能別設定更新を統合検証
  let repository: PrismaGuildConfigRepository;
  const baseTime = new Date("2026-02-20T00:00:00.000Z");

  // 基準時刻からの差分で日時を作るヘルパー
  const atOffsetMs = (offsetMs: number): Date =>
    new Date(baseTime.getTime() + offsetMs);

  // 各テストでリポジトリインスタンスとモック呼び出し履歴を初期化
  beforeEach(() => {
    // @ts-expect-error - モックのため型エラーは無視
    repository = new PrismaGuildConfigRepository(mockPrismaClient);
    vi.clearAllMocks();
  });

  describe("getConfig()", () => {
    it("should return guild config when found", async () => {
      // DBレコード(JSON文字列)がドメイン型へ復元されること
      const mockRecord = {
        guildId: "123456789",
        locale: "ja",
        afkConfig: JSON.stringify({ enabled: true, channelId: "111" }),
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(mockRecord);

      const config = await repository.getConfig("123456789");

      expect(config).toBeDefined();
      expect(config?.guildId).toBe("123456789");
      expect(config?.locale).toBe("ja");
    });

    it("should return null when config not found", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(null);

      const config = await repository.getConfig("nonexistent");

      expect(config).toBeNull();
    });

    it("should throw DatabaseError on failure", async () => {
      mockPrismaClient.guildConfig.findUnique.mockRejectedValue(
        new Error("DB connection failed"),
      );

      await expect(repository.getConfig("123456789")).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe("saveConfig()", () => {
    it("should create new guild config", async () => {
      const newConfig: GuildConfig = {
        guildId: "123456789",
        locale: "ja",
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      };

      mockPrismaClient.guildConfig.create.mockResolvedValue({
        guildId: newConfig.guildId,
        locale: newConfig.locale,
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: newConfig.createdAt,
        updatedAt: newConfig.updatedAt,
      });

      await repository.saveConfig(newConfig);

      expect(mockPrismaClient.guildConfig.create).toHaveBeenCalled();
    });

    it("should throw DatabaseError on save failure", async () => {
      const newConfig: GuildConfig = {
        guildId: "123456789",
        locale: "ja",
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      };

      mockPrismaClient.guildConfig.create.mockRejectedValue(
        new Error("Unique constraint failed"),
      );

      await expect(repository.saveConfig(newConfig)).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe("updateConfig()", () => {
    it("should update existing config", async () => {
      mockPrismaClient.guildConfig.upsert.mockResolvedValue({
        guildId: "123456789",
        locale: "en",
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      await repository.updateConfig("123456789", { locale: "en" });

      expect(mockPrismaClient.guildConfig.upsert).toHaveBeenCalled();
    });

    it("should create config if not exists (upsert)", async () => {
      // upsert により未作成ギルドでも更新APIで作成できること
      mockPrismaClient.guildConfig.upsert.mockResolvedValue({
        guildId: "123456789",
        locale: "ja",
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      await repository.updateConfig("123456789", { locale: "en" });

      expect(mockPrismaClient.guildConfig.upsert).toHaveBeenCalled();
    });
  });

  describe("deleteConfig()", () => {
    it("should delete guild config", async () => {
      mockPrismaClient.guildConfig.delete.mockResolvedValue({
        guildId: "123456789",
        locale: "ja",
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      await repository.deleteConfig("123456789");

      expect(mockPrismaClient.guildConfig.delete).toHaveBeenCalled();
    });
  });

  describe("exists()", () => {
    it("should return true when config exists", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        id: "some-id",
      });

      const exists = await repository.exists("123456789");

      expect(exists).toBe(true);
    });

    it("should return false when config does not exist", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(null);

      const exists = await repository.exists("nonexistent");

      expect(exists).toBe(false);
    });
  });

  describe("getLocale()", () => {
    it("should return guild locale", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        guildId: "123456789",
        locale: "en",
        afkConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        memberLogConfig: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      const locale = await repository.getLocale("123456789");

      expect(locale).toBe("en");
    });

    it("should return default locale when config not found", async () => {
      // 未設定ギルドは既定ロケールを返す
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(null);

      const locale = await repository.getLocale("nonexistent");

      expect(locale).toBe("ja");
    });
  });

  describe("setAfkChannel()", () => {
    it("should create AFK config when not configured", async () => {
      // AFK設定未作成時は初期化してから保存
      mockPrismaClient.guildConfig.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          afkConfig: JSON.stringify({
            enabled: true,
            channelId: "vc-1",
          }),
        });
      mockPrismaClient.guildConfig.upsert.mockResolvedValue({});

      await repository.setAfkChannel("123456789", "vc-1");

      expect(mockPrismaClient.guildConfig.upsert).toHaveBeenCalled();
    });

    it("should update AFK config with CAS when configured", async () => {
      // 既存値一致を条件に CAS で更新する
      const currentConfig = {
        enabled: true,
        channelId: "vc-1",
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        afkConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      await repository.setAfkChannel("123456789", "new-vc");

      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          afkConfig: JSON.stringify(currentConfig),
        },
        data: {
          afkConfig: JSON.stringify({
            enabled: true,
            channelId: "new-vc",
          }),
        },
      });
    });
  });

  describe("updateAfkConfig()", () => {
    it("should merge update with existing AFK config via CAS", async () => {
      const currentConfig = {
        enabled: true,
        channelId: "old-vc",
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        afkConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      await repository.updateAfkConfig("123456789", {
        enabled: false,
      });

      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          afkConfig: JSON.stringify(currentConfig),
        },
        data: {
          afkConfig: JSON.stringify({
            enabled: false,
            channelId: "old-vc",
          }),
        },
      });
    });
  });

  describe("getBumpReminderConfig()", () => {
    it("should return default enabled config when not configured", async () => {
      // bump設定が無い場合は既定値（enabled: true）を返す
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(null);

      const config = await repository.getBumpReminderConfig("123456789");

      expect(config).toEqual({
        enabled: true,
        mentionRoleId: undefined,
        mentionUserIds: [],
      });
    });

    it("should return stored config when configured", async () => {
      const mockBumpConfig = {
        enabled: false,
        channelId: "999999999",
        mentionRoleId: "888888888",
        mentionUserIds: ["111111111", "222222222"],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        guildId: "123456789",
        locale: "ja",
        bumpReminderConfig: JSON.stringify(mockBumpConfig),
        afkConfig: null,
        vacConfig: null,
        memberLogConfig: null,
        stickMessages: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      const config = await repository.getBumpReminderConfig("123456789");

      expect(config).toEqual(mockBumpConfig);
    });

    it("should return default enabled config when bumpReminderConfig is null", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        guildId: "123456789",
        locale: "ja",
        bumpReminderConfig: null,
        afkConfig: null,
        vacConfig: null,
        memberLogConfig: null,
        stickMessages: null,
        createdAt: atOffsetMs(0),
        updatedAt: atOffsetMs(0),
      });

      const config = await repository.getBumpReminderConfig("123456789");

      expect(config).toEqual({
        enabled: true,
        mentionRoleId: undefined,
        mentionUserIds: [],
      });
    });
  });

  describe("setBumpReminderEnabled()", () => {
    it("should create bump config when not configured", async () => {
      mockPrismaClient.guildConfig.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          bumpReminderConfig: JSON.stringify({
            enabled: true,
            channelId: "ch-1",
            mentionRoleId: undefined,
            mentionUserIds: [],
          }),
        });
      mockPrismaClient.guildConfig.upsert.mockResolvedValue({});

      await repository.setBumpReminderEnabled("123456789", true, "ch-1");

      expect(mockPrismaClient.guildConfig.upsert).toHaveBeenCalled();
    });

    it("should update existing bump config while preserving mentions", async () => {
      const currentConfig = {
        enabled: true,
        channelId: "ch-1",
        mentionUserIds: [],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      await repository.setBumpReminderEnabled("123456789", false);

      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: JSON.stringify(currentConfig),
        },
        data: {
          bumpReminderConfig: JSON.stringify({
            ...currentConfig,
            enabled: false,
            channelId: "ch-1",
            mentionUserIds: [],
          }),
        },
      });
    });
  });

  describe("updateBumpReminderConfig()", () => {
    it("should initialize bump config when null", async () => {
      const nextConfig = {
        enabled: true,
        channelId: "ch-1",
        mentionRoleId: "role-1",
        mentionUserIds: ["user-1"],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: null,
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      await repository.updateBumpReminderConfig("123456789", nextConfig);

      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: null,
        },
        data: {
          bumpReminderConfig: JSON.stringify(nextConfig),
        },
      });
    });

    it("should CAS-update existing bump config", async () => {
      const currentConfig = {
        enabled: false,
        channelId: "old",
        mentionRoleId: undefined,
        mentionUserIds: [],
      };
      const nextConfig = {
        enabled: true,
        channelId: "new",
        mentionRoleId: "role-1",
        mentionUserIds: ["user-1"],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      await repository.updateBumpReminderConfig("123456789", nextConfig);

      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: JSON.stringify(currentConfig),
        },
        data: {
          bumpReminderConfig: JSON.stringify(nextConfig),
        },
      });
    });
  });

  describe("addBumpReminderMentionUser()", () => {
    it("should initialize default config and add user when not configured", async () => {
      // 未設定時は初期化後にユーザーIDを追加
      mockPrismaClient.guildConfig.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          bumpReminderConfig: JSON.stringify({
            enabled: true,
            mentionRoleId: undefined,
            mentionUserIds: [],
          }),
        });
      mockPrismaClient.guildConfig.upsert.mockResolvedValue({});
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.addBumpReminderMentionUser(
        "123456789",
        "user-a",
      );

      expect(result).toBe("added");
      expect(mockPrismaClient.guildConfig.upsert).toHaveBeenCalled();
      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: JSON.stringify({
            enabled: true,
            mentionRoleId: undefined,
            mentionUserIds: [],
          }),
        },
        data: {
          bumpReminderConfig: JSON.stringify({
            enabled: true,
            mentionRoleId: undefined,
            mentionUserIds: ["user-a"],
          }),
        },
      });
    });

    it("should add user when not in mention list", async () => {
      const currentConfig = {
        enabled: true,
        channelId: "111",
        mentionRoleId: "222",
        mentionUserIds: ["user-a"],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.addBumpReminderMentionUser(
        "123456789",
        "user-b",
      );

      expect(result).toBe("added");
      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: JSON.stringify(currentConfig),
        },
        data: {
          bumpReminderConfig: JSON.stringify({
            ...currentConfig,
            mentionUserIds: ["user-a", "user-b"],
          }),
        },
      });
    });

    it("should return already-exists when user is already in list", async () => {
      // 既存ユーザーは重複追加せず結果コードを返す
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify({
          enabled: true,
          mentionUserIds: ["user-a"],
        }),
      });

      const result = await repository.addBumpReminderMentionUser(
        "123456789",
        "user-a",
      );

      expect(result).toBe("already-exists");
      expect(mockPrismaClient.guildConfig.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("setBumpReminderMentionRole()", () => {
    it("should set mention role", async () => {
      const currentConfig = {
        enabled: true,
        channelId: "111",
        mentionRoleId: "old-role",
        mentionUserIds: ["user-a"],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.setBumpReminderMentionRole(
        "123456789",
        "new-role",
      );

      expect(result).toBe("updated");
      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: JSON.stringify(currentConfig),
        },
        data: {
          bumpReminderConfig: JSON.stringify({
            ...currentConfig,
            mentionRoleId: "new-role",
            mentionUserIds: ["user-a"],
          }),
        },
      });
    });
  });

  describe("removeBumpReminderMentionUser()", () => {
    it("should remove user when in mention list", async () => {
      const currentConfig = {
        enabled: true,
        channelId: "111",
        mentionRoleId: "222",
        mentionUserIds: ["user-a", "user-b"],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.removeBumpReminderMentionUser(
        "123456789",
        "user-b",
      );

      expect(result).toBe("removed");
      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: JSON.stringify(currentConfig),
        },
        data: {
          bumpReminderConfig: JSON.stringify({
            ...currentConfig,
            mentionUserIds: ["user-a"],
          }),
        },
      });
    });

    it("should return not-found when user is not in list", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify({
          enabled: true,
          mentionUserIds: ["user-a"],
        }),
      });

      const result = await repository.removeBumpReminderMentionUser(
        "123456789",
        "user-z",
      );

      expect(result).toBe("not-found");
      expect(mockPrismaClient.guildConfig.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("clearBumpReminderMentionUsers()", () => {
    it("should clear all mention users", async () => {
      const currentConfig = {
        enabled: true,
        channelId: "111",
        mentionRoleId: "role-a",
        mentionUserIds: ["user-a", "user-b"],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      const result =
        await repository.clearBumpReminderMentionUsers("123456789");

      expect(result).toBe("cleared");
      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: JSON.stringify(currentConfig),
        },
        data: {
          bumpReminderConfig: JSON.stringify({
            ...currentConfig,
            mentionUserIds: [],
          }),
        },
      });
    });
  });

  describe("clearBumpReminderMentions()", () => {
    it("should clear role and users", async () => {
      // ロールIDとユーザー一覧の両方を同時にクリア
      const currentConfig = {
        enabled: true,
        channelId: "111",
        mentionRoleId: "role-a",
        mentionUserIds: ["user-a", "user-b"],
      };

      mockPrismaClient.guildConfig.findUnique.mockResolvedValue({
        bumpReminderConfig: JSON.stringify(currentConfig),
      });
      mockPrismaClient.guildConfig.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.clearBumpReminderMentions("123456789");

      expect(result).toBe("cleared");
      expect(mockPrismaClient.guildConfig.updateMany).toHaveBeenCalledWith({
        where: {
          guildId: "123456789",
          bumpReminderConfig: JSON.stringify(currentConfig),
        },
        data: {
          bumpReminderConfig: JSON.stringify({
            ...currentConfig,
            mentionRoleId: undefined,
            mentionUserIds: [],
          }),
        },
      });
    });
  });
});
