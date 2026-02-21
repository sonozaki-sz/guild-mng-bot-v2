// vitest.config.ts
// Vitest 設定（Jest → Vitest 移行）

import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // テスト実行環境
    environment: "node",

    // グローバル API を有効化（describe / it / expect / vi が import なしで使える）
    globals: true,

    // テストファイルの検索対象
    include: ["src/**/*.{test,spec}.ts", "tests/**/*.{test,spec}.ts"],

    // 各テスト実行前のセットアップファイル
    setupFiles: ["./tests/setup.ts"],

    // タイムアウト（ms）
    testTimeout: 10000,

    // モック自動リセット設定
    clearMocks: true,
    restoreMocks: true,

    // カバレッジ設定
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/main.ts",
        "src/**/server.ts",
      ],
      reportsDirectory: "coverage",
      reporter: ["text", "lcov", "html"],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },

  // パスエイリアス（@/ → src/）
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
