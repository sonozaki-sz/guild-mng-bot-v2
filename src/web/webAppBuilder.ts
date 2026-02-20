// src/web/webAppBuilder.ts
// Fastify アプリの構築処理

import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import { join } from "path";
import { NODE_ENV, env } from "../shared/config";
import { tDefault } from "../shared/locale";
import { logger } from "../shared/utils";
import { apiRoutes } from "./routes/api";
import { healthRoute } from "./routes/health";

// Web アプリ構築時に利用する設定値を集約した定数
const WEB_APP_CONSTANTS = {
  STATIC_PUBLIC_DIR: "public",
  STATIC_PREFIX: "/",
  API_PREFIX: "/api",
} as const;

/**
 * Fastify アプリを構築し、ルートとミドルウェアを登録して返す関数
 */
export async function buildWebApp(baseDir: string): Promise<FastifyInstance> {
  // Fastify 本体を生成（ロガーは独自 logger を使用）
  const fastify = Fastify({
    logger: false,
    trustProxy: true,
  });

  // CORS を環境に応じて設定（本番は許可オリジンを限定）
  await fastify.register(fastifyCors, {
    origin:
      env.NODE_ENV === NODE_ENV.PRODUCTION
        ? (env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? [])
        : true,
    credentials: true,
  });

  // 静的配信（web/public）を登録
  await fastify.register(fastifyStatic, {
    root: join(baseDir, WEB_APP_CONSTANTS.STATIC_PUBLIC_DIR),
    prefix: WEB_APP_CONSTANTS.STATIC_PREFIX,
  });

  // 監視系ルート（health）を登録
  await fastify.register(healthRoute);
  // API ルートを /api プレフィックスで登録
  await fastify.register(apiRoutes, {
    prefix: WEB_APP_CONSTANTS.API_PREFIX,
  });

  // 共通エラーハンドラ（ログ + API レスポンス整形）
  fastify.setErrorHandler((error, request, reply) => {
    const err = error as Error & { statusCode?: number };
    logger.error(tDefault("system:web.api_error"), {
      error: err.message,
      stack: err.stack,
      url: request.url,
      method: request.method,
    });

    // 本番では内部詳細を隠し、開発時のみ message を返す
    reply.status(err.statusCode || 500).send({
      error: tDefault("system:web.internal_server_error"),
      message: env.NODE_ENV === NODE_ENV.DEVELOPMENT ? err.message : undefined,
    });
  });

  // 完成した Fastify インスタンスを呼び出し元へ返す
  return fastify;
}
