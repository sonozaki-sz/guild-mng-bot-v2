/**
 * GuildConfigRepository Integration Tests
 * Prisma Repositoryの統合テスト
 */

import {
  PrismaGuildConfigRepository,
  type GuildConfig,
} from "../../../src/shared/database/repositories/GuildConfigRepository";
import { DatabaseError } from "../../../src/shared/errors/CustomErrors";

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
  tDefault: (key: string) => `mocked:${key}`,
}));

// Prismaクライアントのモック
const mockPrismaClient = {
  guildConfig: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe("PrismaGuildConfigRepository", () => {
  let repository: PrismaGuildConfigRepository;

  beforeEach(() => {
    // @ts-expect-error - モックのため型エラーは無視
    repository = new PrismaGuildConfigRepository(mockPrismaClient);
    jest.clearAllMocks();
  });

  describe("getConfig()", () => {
    it("should return guild config when found", async () => {
      const mockRecord = {
        guildId: "123456789",
        locale: "ja",
        afkConfig: JSON.stringify({ enabled: true, channelId: "111" }),
        profChannelConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        joinLeaveLogConfig: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.guildConfig.create.mockResolvedValue({
        guildId: newConfig.guildId,
        locale: newConfig.locale,
        afkConfig: null,
        profChannelConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        joinLeaveLogConfig: null,
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
      mockPrismaClient.guildConfig.count.mockResolvedValue(1);
      mockPrismaClient.guildConfig.update.mockResolvedValue({
        guildId: "123456789",
        locale: "en",
        afkConfig: null,
        profChannelConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        joinLeaveLogConfig: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.updateConfig("123456789", { locale: "en" });

      expect(mockPrismaClient.guildConfig.update).toHaveBeenCalled();
    });

    it("should create config if not exists", async () => {
      mockPrismaClient.guildConfig.count.mockResolvedValue(0);
      mockPrismaClient.guildConfig.create.mockResolvedValue({
        guildId: "123456789",
        locale: "ja",
        afkConfig: null,
        profChannelConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        joinLeaveLogConfig: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.updateConfig("123456789", { locale: "en" });

      expect(mockPrismaClient.guildConfig.create).toHaveBeenCalled();
    });
  });

  describe("deleteConfig()", () => {
    it("should delete guild config", async () => {
      mockPrismaClient.guildConfig.delete.mockResolvedValue({
        guildId: "123456789",
        locale: "ja",
        afkConfig: null,
        profChannelConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        joinLeaveLogConfig: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.deleteConfig("123456789");

      expect(mockPrismaClient.guildConfig.delete).toHaveBeenCalled();
    });
  });

  describe("exists()", () => {
    it("should return true when config exists", async () => {
      mockPrismaClient.guildConfig.count.mockResolvedValue(1);

      const exists = await repository.exists("123456789");

      expect(exists).toBe(true);
    });

    it("should return false when config does not exist", async () => {
      mockPrismaClient.guildConfig.count.mockResolvedValue(0);

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
        profChannelConfig: null,
        vacConfig: null,
        bumpReminderConfig: null,
        stickMessages: null,
        joinLeaveLogConfig: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const locale = await repository.getLocale("123456789");

      expect(locale).toBe("en");
    });

    it("should return default locale when config not found", async () => {
      mockPrismaClient.guildConfig.findUnique.mockResolvedValue(null);

      const locale = await repository.getLocale("nonexistent");

      expect(locale).toBe("ja");
    });
  });
});
