/**
 * Jest Setup File
 * テスト実行前のグローバル設定
 */

// デフォルト環境変数を設定
process.env.NODE_ENV = "test";
process.env.DISCORD_TOKEN = "test-token-" + "a".repeat(50);
process.env.DISCORD_APP_ID = "1234567890";
process.env.DATABASE_URL = "file::memory:?cache=shared";
process.env.LOG_LEVEL = "error"; // テスト中はエラーのみログ出力

// タイムゾーンを固定
process.env.TZ = "UTC";

// EventEmitterのリスナー制限を増やす
import { EventEmitter } from "events";
EventEmitter.defaultMaxListeners = 20;

// コンソール出力を抑制（必要に応じてコメントアウト）
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // error は残す（テスト失敗時に確認が必要）
};

// テストタイムアウトを設定
jest.setTimeout(10000);
