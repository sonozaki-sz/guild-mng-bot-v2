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
        // Type-only files (no runtime executable code)
        "src/shared/database/stores/usecases/bumpReminderStoreContext.ts",
        "src/bot/features/bump-reminder/repositories/types.ts",
        "src/bot/features/sticky-message/repositories/types.ts",
        "src/bot/handlers/interactionCreate/ui/types.ts",
        // Re-export barrel with no executable statements (v8 cannot track)
        "src/shared/errors/errorHandler.ts",
      ],
      reportsDirectory: "coverage",
      reporter: ["text", "lcov", "html"],
      thresholds: {
        branches: 99,
        functions: 100,
        lines: 100,
        statements: 100,
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
