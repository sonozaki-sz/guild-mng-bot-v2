// src/shared/config/env.ts
// 環境変数管理（Zod バリデーション）

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Discord
  DISCORD_TOKEN: z.string().min(50, "DISCORD_TOKENが設定されていません"),
  DISCORD_APP_ID: z.string().min(10, "DISCORD_APP_IDが設定されていません"),

  // ロケール
  LOCALE: z.string().default("ja"),

  // データベース
  DATABASE_URL: z.string().default("file:./storage/db.sqlite"),

  // Webサーバー
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  WEB_HOST: z.string().default("0.0.0.0"),

  // JWT（Web UI認証用）
  JWT_SECRET: z.string().optional(),

  // ログレベル
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ 環境変数の検証に失敗しました:");
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\n.env ファイルを確認してください。");
    }
    process.exit(1);
  }
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
