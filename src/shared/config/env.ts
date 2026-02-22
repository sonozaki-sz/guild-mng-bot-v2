// src/shared/config/env.ts
// 環境変数管理（Zod バリデーション）

import "dotenv/config";
import { z } from "zod";

export const NODE_ENV_VALUES = ["development", "production", "test"] as const;

export const NODE_ENV = {
  DEVELOPMENT: NODE_ENV_VALUES[0],
  PRODUCTION: NODE_ENV_VALUES[1],
  TEST: NODE_ENV_VALUES[2],
} as const;

export type NodeEnv = (typeof NODE_ENV_VALUES)[number];

// 環境変数スキーマ定義（起動時バリデーション用）
const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENV_VALUES).default(NODE_ENV.DEVELOPMENT),

  // Discord
  DISCORD_TOKEN: z.string().min(50, "DISCORD_TOKEN is not configured"),
  DISCORD_APP_ID: z.string().min(10, "DISCORD_APP_ID is not configured"),
  DISCORD_GUILD_ID: z.string().optional(), // 開発用：設定するとギルドコマンドとして即座に登録

  // ロケール
  LOCALE: z.string().default("ja"),

  // データベース
  DATABASE_URL: z.string().default("file:./storage/db.sqlite"),

  // Webサーバー
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  WEB_HOST: z.string().default("0.0.0.0"),

  // JWT（Web UI認証用）
  JWT_SECRET: z.string().optional(),

  // CORS（本番環境の許可オリジンをカンマ区切りで複数指定可能）
  CORS_ORIGIN: z.string().optional(),

  // ログレベル
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),

  // テストモード（機能のテスト用動作を有効化）
  TEST_MODE: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

// 実行環境変数を検証して利用可能な設定へ変換する
const parseEnv = () => {
  try {
    // 1) 依存関係を含む追加検証 2) 実環境変数をパース
    const result = envSchema.parse(process.env);

    // JWT_SECRET 未設定を警告（Web API 認証が無効になる）
    // 本番環境の必須チェックは Web サーバー起動時に行う（bot 単体起動では不要なため）
    if (!result.JWT_SECRET) {
      console.warn(
        "⚠️  JWT_SECRET is not set — Web API authentication is DISABLED. " +
          "Set JWT_SECRET in .env to enable API authorization.",
      );
    }

    // 検証済み設定を呼び出し元へ返す
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Note: tDefaultは使用できない（env.tsはi18n初期化前に実行される）
      console.error("❌ Environment variable validation failed:");
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\nPlease check your .env file.");
    }
    // 起動継続すると不正設定状態で動作するため即時終了
    process.exit(1);
  }
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
