// src/shared/errors/ErrorHandler.ts
// グローバルエラーハンドラ
// REFACTORING_PLAN.md Phase 2 準拠

import { ChatInputCommandInteraction, RepliableInteraction } from "discord.js";
import { tDefault } from "../locale";
import { logger } from "../utils/logger";
import { BaseError } from "./CustomErrors";

/**
 * エラーログ出力
 */
export const logError = (error: Error | BaseError): void => {
  if (error instanceof BaseError) {
    if (error.isOperational) {
      logger.warn(`[${error.name}] ${error.message}`, {
        statusCode: error.statusCode,
        stack: error.stack,
      });
    } else {
      logger.error(`[${error.name}] ${error.message}`, {
        statusCode: error.statusCode,
        stack: error.stack,
      });
    }
  } else {
    logger.error(`[UnhandledError] ${error.message}`, {
      stack: error.stack,
    });
  }
};

/**
 * ユーザー向けエラーメッセージ取得
 */
export const getUserFriendlyMessage = (error: Error | BaseError): string => {
  if (error instanceof BaseError && error.isOperational) {
    return error.message;
  }

  // 本番環境では詳細を隠す
  if (process.env.NODE_ENV === "production") {
    return "予期しないエラーが発生しました。後ほど再度お試しください。";
  }

  return `エラー: ${error.message}`;
};

/**
 * コマンド実行時のエラーハンドラ
 */
export const handleCommandError = async (
  interaction: ChatInputCommandInteraction,
  error: Error | BaseError,
): Promise<void> => {
  logError(error);

  const message = getUserFriendlyMessage(error);

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `❌ ${message}`,
      });
    } else {
      await interaction.reply({
        content: `❌ ${message}`,
        ephemeral: true,
      });
    }
  } catch (replyError) {
    logger.error(tDefault("system:error.reply_failed"), replyError);
  }
};

/**
 * インタラクション全般のエラーハンドラ
 * （モーダル、ボタン、セレクトメニューなど）
 */
export const handleInteractionError = async (
  interaction: RepliableInteraction,
  error: Error | BaseError,
): Promise<void> => {
  logError(error);

  const message = getUserFriendlyMessage(error);

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `❌ ${message}`,
      });
    } else {
      await interaction.reply({
        content: `❌ ${message}`,
        ephemeral: true,
      });
    }
  } catch (replyError) {
    logger.error(tDefault("system:error.reply_failed"), replyError);
  }
};

/**
 * グローバル未処理エラーハンドラ
 */
export const setupGlobalErrorHandlers = (): void => {
  // Unhandled Promise Rejection
  process.on(
    "unhandledRejection",
    (reason: unknown, promise: Promise<unknown>) => {
      logger.error(tDefault("system:error.unhandled_rejection_log"), {
        reason,
        promise,
      });

      if (reason instanceof Error) {
        logError(reason);
      }
    },
  );

  // Uncaught Exception
  process.on("uncaughtException", (error: Error) => {
    logger.error(tDefault("system:error.uncaught_exception_log"), error);
    logError(error);

    // 非運用エラーの場合はプロセスを終了
    if (error instanceof BaseError && !error.isOperational) {
      process.exit(1);
    }
  });

  // ワーニング
  process.on("warning", (warning: Error) => {
    logger.warn(tDefault("system:error.node_warning"), {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });
};

/**
 * プロセス終了時の処理
 */
export const setupGracefulShutdown = (cleanup?: () => Promise<void>): void => {
  const shutdown = async (signal: string) => {
    logger.info(tDefault("system:shutdown.signal_received", { signal }));

    try {
      if (cleanup) {
        await cleanup();
      }
      logger.info(tDefault("system:error.cleanup_complete"));
      process.exit(0);
    } catch (error) {
      logger.error(tDefault("system:error.cleanup_failed"), error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};
