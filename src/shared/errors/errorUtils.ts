// src/shared/errors/errorUtils.ts
// Discord非依存のエラー共通ユーティリティ

import { NODE_ENV, env } from "../config/env";
import { tDefault } from "../locale/localeManager";
import { logger } from "../utils/logger";
import { BaseError } from "./customErrors";

/**
 * 任意の値を Error | BaseError に変換する
 * @param error 変換対象の値
 * @returns Error または BaseError インスタンス
 */
export const toError = (error: unknown): Error | BaseError => {
  if (error instanceof BaseError || error instanceof Error) {
    return error;
  }
  return new Error(String(error));
};

/**
 * エラーを適切なレベルでロガーに出力する
 * BaseError の isOperational に応じて warn/error を切り替える
 * @param error 出力対象のエラー
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
    return;
  }

  logger.error(`[UnhandledError] ${error.message}`, {
    stack: error.stack,
  });
};

/**
 * ユーザーに表示するエラーメッセージを生成する
 * 運用系エラーは message をそのまま返し、非運用系エラーは本番で内部詳細を隠す
 * @param error 変換対象のエラー
 * @returns ユーザー向けメッセージ文字列
 */
export const getUserFriendlyMessage = (error: Error | BaseError): string => {
  if (error instanceof BaseError && error.isOperational) {
    return error.message;
  }

  if (env.NODE_ENV === NODE_ENV.PRODUCTION) {
    return tDefault("errors:general.unexpected_production");
  }

  return tDefault("errors:general.unexpected_with_message", {
    message: error.message,
  });
};
