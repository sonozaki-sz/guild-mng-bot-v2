// src/shared/utils/logger.ts
// ロガー設定（Winston）
// REFACTORING_PLAN.md Phase 2 準拠

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "../config/env";

const isDevelopment = env.NODE_ENV === "development";

// ログフォーマット
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
    const stackStr = stack ? `\n${stack}` : "";
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}${stackStr}`;
  }),
);

// コンソール用カラーフォーマット
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const stackStr = stack ? `\n${stack}` : "";
    return `${timestamp} [${level}]: ${message}${stackStr}`;
  }),
);

// Transports設定
const transports: winston.transport[] = [];

// コンソール出力（開発環境または明示的に有効化）
if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: env.LOG_LEVEL || "debug",
    }),
  );
}

// 全ログファイル（日次ローテーション）
transports.push(
  new DailyRotateFile({
    filename: "logs/app-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "10m",
    maxFiles: "14d",
    format: logFormat,
    level: "info",
  }),
);

// エラーログファイル（日次ローテーション）
transports.push(
  new DailyRotateFile({
    filename: "logs/error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "10m",
    maxFiles: "30d",
    format: logFormat,
    level: "error",
  }),
);

// 本番環境でもコンソール出力（docker logs用）
if (!isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: "info",
    }),
  );
}

// Logger作成
export const logger = winston.createLogger({
  level: env.LOG_LEVEL || "info",
  transports,
  exitOnError: false,
});

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down gracefully...");
  setTimeout(() => process.exit(0), 1000);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down...");
  setTimeout(() => process.exit(0), 1000);
});

export default logger;
