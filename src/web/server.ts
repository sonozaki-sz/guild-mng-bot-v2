// src/web/server.ts
// Fastify Webサーバー

import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { join } from "path";
import { env } from "../shared/config/env";
import { logger } from "../shared/utils/logger";
import { apiRoutes } from "./routes/api";
import { healthRoute } from "./routes/health";

async function startWebServer() {
  const fastify = Fastify({
    logger: false, // 独自のloggerを使用
    trustProxy: true,
  });

  try {
    // CORS設定
    await fastify.register(fastifyCors, {
      origin: env.NODE_ENV === "production" ? ["https://yourdomain.com"] : true,
      credentials: true,
    });

    // 静的ファイル配信
    await fastify.register(fastifyStatic, {
      root: join(__dirname, "public"),
      prefix: "/",
    });

    // ヘルスチェック
    await fastify.register(healthRoute);

    // APIルート
    await fastify.register(apiRoutes, { prefix: "/api" });

    // エラーハンドラー
    fastify.setErrorHandler((error, request, reply) => {
      const err = error as Error & { statusCode?: number };
      logger.error("API Error:", {
        error: err.message,
        stack: err.stack,
        url: request.url,
        method: request.method,
      });

      reply.status(err.statusCode || 500).send({
        error: "Internal Server Error",
        message: env.NODE_ENV === "development" ? err.message : undefined,
      });
    });

    // サーバー起動
    await fastify.listen({
      port: env.WEB_PORT,
      host: env.WEB_HOST,
    });

    logger.info(
      `Web サーバーが起動しました: http://${env.WEB_HOST}:${env.WEB_PORT}`,
    );
  } catch (error) {
    logger.error("Webサーバー起動エラー:", error);
    process.exit(1);
  }
}

// エラーハンドリング
process.on("unhandledRejection", (error) => {
  logger.error("未処理のPromise拒否:", error);
});

process.on("uncaughtException", (error) => {
  logger.error("未処理の例外:", error);
  process.exit(1);
});

// 起動
startWebServer().catch((error) => {
  logger.error("Webサーバー起動失敗:", error);
  process.exit(1);
});
