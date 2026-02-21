// src/shared/errors/customErrors.ts
// カスタムエラークラス

/**
 * ベースエラークラス
 */
export class BaseError extends Error {
  // エラー種別名（ログ/分岐用）
  public readonly name: string;
  // 運用系エラーか（プロセス継続可否の判断に使用）
  public readonly isOperational: boolean;
  // HTTP相当ステータス（必要時のみ）
  public readonly statusCode?: number;
  // Embed応答時のタイトル上書き
  public readonly embedTitle?: string;

  constructor(
    name: string,
    message: string,
    isOperational = true,
    statusCode?: number,
    embedTitle?: string,
  ) {
    super(message);
    // instanceof 判定が壊れないようプロトタイプを補正
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.isOperational = isOperational;
    this.statusCode = statusCode;
    this.embedTitle = embedTitle;

    // 呼び出し元起点のスタックを保持
    Error.captureStackTrace(this);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends BaseError {
  constructor(message: string, embedTitle?: string) {
    // 入力不正は運用系エラーとして 400 を付与
    super("ValidationError", message, true, 400, embedTitle);
  }
}

/**
 * 設定エラー
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, embedTitle?: string) {
    // 設定不備は運用系エラーとして 500 を付与
    super("ConfigurationError", message, true, 500, embedTitle);
  }
}

/**
 * データベースエラー
 */
export class DatabaseError extends BaseError {
  constructor(message: string, isOperational = true, embedTitle?: string) {
    super("DatabaseError", message, isOperational, 500, embedTitle);
  }
}

/**
 * Discord APIエラー
 */
export class DiscordApiError extends BaseError {
  constructor(message: string, statusCode?: number, embedTitle?: string) {
    super("DiscordApiError", message, true, statusCode || 500, embedTitle);
  }
}

/**
 * 権限エラー
 */
export class PermissionError extends BaseError {
  constructor(message: string, embedTitle?: string) {
    // 権限不足は 403 を付与
    super("PermissionError", message, true, 403, embedTitle);
  }
}

/**
 * リソース未検出エラー
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, embedTitle?: string) {
    // リソース未検出を 404 として扱う
    super("NotFoundError", `${resource} not found`, true, 404, embedTitle);
  }
}

/**
 * タイムアウトエラー
 */
export class TimeoutError extends BaseError {
  constructor(message: string, embedTitle?: string) {
    super("TimeoutError", message, true, 408, embedTitle);
  }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends BaseError {
  constructor(message: string, embedTitle?: string) {
    super("RateLimitError", message, true, 429, embedTitle);
  }
}
