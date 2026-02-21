/**
 * ErrorHandler Unit Tests
 * エラーハンドリング機能のテスト
 */

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { handleCommandError } from "../../../src/bot/errors/interactionErrorHandler";
import { NODE_ENV, env } from "../../../src/shared/config/env";
import {
  BaseError,
  DatabaseError,
  ValidationError,
} from "../../../src/shared/errors/customErrors";
import {
  getUserFriendlyMessage,
  logError,
} from "../../../src/shared/errors/errorHandler";
import { logger } from "../../../src/shared/utils";

// Logger のモック
jest.mock("../../../src/shared/utils", () => ({
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
  // ログ出力・ユーザー向けメッセージ変換・Interaction応答分岐を検証
  // 各テスト実行前にモックの呼び出し履歴を初期化
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
    const originalEnv = env.NODE_ENV;

    // NODE_ENV の上書きが他テストへ漏れないよう復元
    afterEach(() => {
      env.NODE_ENV = originalEnv;
    });

    it("should return operational error message", () => {
      const error = new ValidationError("フィールドが必須です");

      const message = getUserFriendlyMessage(error);

      expect(message).toBe("フィールドが必須です");
    });

    it("should return generic message in production for non-operational errors", () => {
      // 本番環境では内部詳細を出さず汎用メッセージにする
      env.NODE_ENV = NODE_ENV.PRODUCTION;
      const error = new Error("Internal server error");

      const message = getUserFriendlyMessage(error);

      expect(message).toBe("予期しないエラーが発生しました。");
    });

    it("should return detailed message in development", () => {
      // 開発環境ではデバッグ容易性のため詳細メッセージを返す
      env.NODE_ENV = NODE_ENV.DEVELOPMENT;
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

    // Interaction の最小モックを毎回組み立てる
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

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining("❌"),
                description: "Invalid command",
              }),
            }),
          ]),
          flags: MessageFlags.Ephemeral,
        }),
      );
    });

    it("should edit reply when already replied", async () => {
      // 応答済みの場合は editReply へフォールバック
      mockInteraction.replied = true;
      const error = new ValidationError("Invalid command");

      await handleCommandError(mockInteraction, error);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining("❌"),
                description: "Invalid command",
              }),
            }),
          ]),
        }),
      );
    });

    it("should edit reply when deferred", async () => {
      // defer 済みの場合も editReply で更新
      mockInteraction.deferred = true;
      const error = new DatabaseError("Connection failed");

      await handleCommandError(mockInteraction, error);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringContaining("❌"),
                description: "Connection failed",
              }),
            }),
          ]),
        }),
      );
    });

    it("should log error before replying", async () => {
      const error = new ValidationError("Test error");

      await handleCommandError(mockInteraction, error);

      expect(logger.warn).toHaveBeenCalled();
    });

    it("should handle reply failure gracefully", async () => {
      // 返信処理自体が失敗しても例外で落とさずログへ記録
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
    it("should prefix error messages title with ❌", async () => {
      // テストごとに独立した Interaction モックを用意
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
          embeds: expect.arrayContaining([
            expect.objectContaining({
              data: expect.objectContaining({
                title: expect.stringMatching(/^❌/),
              }),
            }),
          ]),
        }),
      );
    });
  });
});
