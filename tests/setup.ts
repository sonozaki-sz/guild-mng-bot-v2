/**
 * Jest Setup File
 * テスト実行前のグローバル設定
 */

// ============================================================
// 環境変数の初期化
// ============================================================
// 各テストで参照される基本環境変数をここで固定する
process.env.NODE_ENV = "test";
process.env.DISCORD_TOKEN = "test-token-" + "a".repeat(50);
process.env.DISCORD_APP_ID = "1234567890";
process.env.DATABASE_URL = "file::memory:?cache=shared";
process.env.LOG_LEVEL = "error"; // テスト中はエラーのみログ出力

// 日時依存のテストを安定させるためタイムゾーンを固定
process.env.TZ = "UTC";

// ============================================================
// Node.js 実行環境のテスト向け調整
// ============================================================
// EventEmitter の警告（MaxListenersExceededWarning）を抑える
import { EventEmitter } from "events";
EventEmitter.defaultMaxListeners = 20;

// 不要な標準出力ノイズを抑制（error は失敗解析のため維持）
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // error は残す（テスト失敗時に確認が必要）
};

// 重い統合テストに備えてデフォルトタイムアウトを延長
jest.setTimeout(10000);
