// src/web/server.ts
// Fastify Webサーバー

import { dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "../shared/config";
import {
  setupGlobalErrorHandlers,
  setupGracefulShutdown,
} from "../shared/errors";
import { localeManager, tDefault } from "../shared/locale";
import { logger } from "../shared/utils";
import { buildWebApp } from "./webAppBuilder";

// 起動ログに表示するURL組み立て用定数
const WEB_SERVER_CONSTANTS = {
  URL_SCHEME_HTTP: "http://",
} as const;

// プロセス終了コード
const PROCESS_EXIT_CODE = {
  FAILURE: 1,
} as const;

// ESM では __dirname が存在しないため __filename から生成する
const __filename = fileURLToPath(import.meta.url);
// Fastify静的配信ルート解決に使うディレクトリパス
const __dirname = dirname(__filename);

/**
 * Webサーバーを初期化して起動する
 */
async function startWebServer() {
  // 翻訳リソース初期化（起動ログ/エラーメッセージで利用）
  await localeManager.initialize();
  // Fastify アプリ本体を構築
  const fastify = await buildWebApp(__dirname);

  try {
    // グレースフルシャットダウン（SIGTERM/SIGINT 受信時に進行中リクエスト完了後に終了）
    setupGracefulShutdown(async () => {
      await fastify.close();
    });

    // listen 開始（host/port は環境変数から解決）
    await fastify.listen({
      port: env.WEB_PORT,
      host: env.WEB_HOST,
    });

    // 起動完了ログ
    logger.info(
      tDefault("system:web.server_started", {
        url: `${WEB_SERVER_CONSTANTS.URL_SCHEME_HTTP}${env.WEB_HOST}:${env.WEB_PORT}`,
      }),
    );
  } catch (error) {
    // 起動失敗時はログ出力して非0終了
    logger.error(tDefault("system:web.startup_error"), error);
    process.exit(PROCESS_EXIT_CODE.FAILURE);
  }
}

// グローバルエラーハンドラーを設定（bot/main.ts と共通）
setupGlobalErrorHandlers();

// 起動
startWebServer().catch((error) => {
  // 予期しない起動例外の最終防波堤
  logger.error(tDefault("system:web.startup_failed"), error);
  process.exit(PROCESS_EXIT_CODE.FAILURE);
});
