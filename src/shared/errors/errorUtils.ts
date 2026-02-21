// src/shared/errors/errorUtils.ts
// Discord非依存のエラー共通ユーティリティ

import { NODE_ENV, env } from "../config/env";
import { tDefault } from "../locale/localeManager";
import { logger } from "../utils/logger";
import { BaseError } from "./customErrors";

export const toError = (error: unknown): Error | BaseError => {
  if (error instanceof BaseError || error instanceof Error) {
    return error;
  }
  return new Error(String(error));
};

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
