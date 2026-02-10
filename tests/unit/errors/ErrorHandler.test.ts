/**
 * ErrorHandler Unit Tests
 * エラーハンドリング機能のテスト
 */

import type { ChatInputCommandInteraction } from "discord.js";
import {
  BaseError,
  DatabaseError,
  ValidationError,
} from "../../../src/shared/errors/CustomErrors";
import {
  getUserFriendlyMessage,
  handleCommandError,
  logError,
} from "../../../src/shared/errors/ErrorHandler";
import { logger } from "../../../src/shared/utils/logger";

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
  tDefault: (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      "errors:general.unexpected_production":
        "予期しないエラーが発生しました。",
      "errors:general.unexpected_with_message": `予期しないエラー: ${params?.message || ""}`,
      "system:error.reply_failed": "返信に失敗しました",
    };
    return translations[key] || key;
  },
}));

describe("ErrorHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("logError()", () => {
    it("should log operational BaseError as warning", () => {
      const error = new ValidationError("Invalid input");

      logError(error);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("[ValidationError]"),
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });

    it("should log non-operational BaseError as error", () => {
      const error = new DatabaseError("Critical DB error", false);

      logError(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("[DatabaseError]"),
        expect.objectContaining({
          statusCode: 500,
        }),
      );
    });

    it("should log regular Error as unhandled error", () => {
      const error = new Error("Generic error");

      logError(error);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("[UnhandledError]"),
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );
    });

    it("should include stack trace in logs", () => {
      const error = new ValidationError("Test error");

      logError(error);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );
    });
  });

  describe("getUserFriendlyMessage()", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it("should return operational error message", () => {
      const error = new ValidationError("フィールドが必須です");

      const message = getUserFriendlyMessage(error);

      expect(message).toBe("フィールドが必須です");
    });

    it("should return generic message in production for non-operational errors", () => {
      process.env.NODE_ENV = "production";
      const error = new Error("Internal server error");

      const message = getUserFriendlyMessage(error);

      expect(message).toBe("予期しないエラーが発生しました。");
    });

    it("should return detailed message in development", () => {
      process.env.NODE_ENV = "development";
      const error = new Error("Detailed error message");

      const message = getUserFriendlyMessage(error);

      expect(message).toContain("Detailed error message");
    });

    it("should handle BaseError with isOperational=true", () => {
      const error = new BaseError("CustomError", "User-friendly message", true);

      const message = getUserFriendlyMessage(error);

      expect(message).toBe("User-friendly message");
    });
  });

  describe("handleCommandError()", () => {
    let mockInteraction: jest.Mocked<ChatInputCommandInteraction>;

    beforeEach(() => {
      mockInteraction = {
        replied: false,
        deferred: false,
        reply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
      } as unknown as jest.Mocked<ChatInputCommandInteraction>;
    });

    it("should reply with error message when not replied", async () => {
      const error = new ValidationError("Invalid command");

      await handleCommandError(mockInteraction, error);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: "❌ Invalid command",
        ephemeral: true,
      });
    });

    it("should edit reply when already replied", async () => {
      mockInteraction.replied = true;
      const error = new ValidationError("Invalid command");

      await handleCommandError(mockInteraction, error);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: "❌ Invalid command",
      });
    });

    it("should edit reply when deferred", async () => {
      mockInteraction.deferred = true;
      const error = new DatabaseError("Connection failed");

      await handleCommandError(mockInteraction, error);

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: "❌ Connection failed",
      });
    });

    it("should log error before replying", async () => {
      const error = new ValidationError("Test error");

      await handleCommandError(mockInteraction, error);

      expect(logger.warn).toHaveBeenCalled();
    });

    it("should handle reply failure gracefully", async () => {
      mockInteraction.reply.mockRejectedValue(new Error("Reply failed"));
      const error = new ValidationError("Test error");

      await handleCommandError(mockInteraction, error);

      expect(logger.error).toHaveBeenCalledWith(
        "返信に失敗しました",
        expect.any(Error),
      );
    });
  });

  describe("Error Message Formatting", () => {
    it("should prefix error messages with ❌", async () => {
      const mockInteraction = {
        replied: false,
        deferred: false,
        reply: jest.fn().mockResolvedValue(undefined),
        editReply: jest.fn().mockResolvedValue(undefined),
      } as unknown as jest.Mocked<ChatInputCommandInteraction>;

      const error = new ValidationError("Test");

      await handleCommandError(mockInteraction, error);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/^❌/),
        }),
      );
    });
  });
});
