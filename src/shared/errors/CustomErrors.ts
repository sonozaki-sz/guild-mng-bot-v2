// src/shared/errors/CustomErrors.ts
// カスタムエラークラス
// REFACTORING_PLAN.md Phase 2 準拠

/**
 * ベースエラークラス
 */
export class BaseError extends Error {
    public readonly name: string;
    public readonly isOperational: boolean;
    public readonly statusCode?: number;

    constructor(name: string, message: string, isOperational = true, statusCode?: number) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = name;
        this.isOperational = isOperational;
        this.statusCode = statusCode;

        Error.captureStackTrace(this);
    }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends BaseError {
    constructor(message: string) {
        super('ValidationError', message, true, 400);
    }
}

/**
 * 設定エラー
 */
export class ConfigurationError extends BaseError {
    constructor(message: string) {
        super('ConfigurationError', message, true, 500);
    }
}

/**
 * データベースエラー
 */
export class DatabaseError extends BaseError {
    constructor(message: string, isOperational = true) {
        super('DatabaseError', message, isOperational, 500);
    }
}

/**
 * Discord APIエラー
 */
export class DiscordApiError extends BaseError {
    constructor(message: string, statusCode?: number) {
        super('DiscordApiError', message, true, statusCode || 500);
    }
}

/**
 * 権限エラー
 */
export class PermissionError extends BaseError {
    constructor(message: string) {
        super('PermissionError', message, true, 403);
    }
}

/**
 * リソース未検出エラー
 */
export class NotFoundError extends BaseError {
    constructor(resource: string) {
        super('NotFoundError', `${resource} not found`, true, 404);
    }
}

/**
 * タイムアウトエラー
 */
export class TimeoutError extends BaseError {
    constructor(message: string) {
        super('TimeoutError', message, true, 408);
    }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends BaseError {
    constructor(message: string) {
        super('RateLimitError', message, true, 429);
    }
}
