// src/web/server.ts
// Fastify Webサーバー

import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { join } from "path";
import { env } from "../shared/config/env";
import { tDefault } from "../shared/locale";
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
      logger.error(tDefault("system:web.api_error"), {
        error: err.message,
        stack: err.stack,
        url: request.url,
        method: request.method,
      });

      reply.status(err.statusCode || 500).send({
        error: tDefault("system:web.internal_server_error"),
        message: env.NODE_ENV === "development" ? err.message : undefined,
      });
    });

    // サーバー起動
    await fastify.listen({
      port: env.WEB_PORT,
      host: env.WEB_HOST,
    });

    logger.info(
      tDefault("system:web.server_started", {
        url: `http://${env.WEB_HOST}:${env.WEB_PORT}`,
      }),
    );
  } catch (error) {
    logger.error(tDefault("system:web.startup_error"), error);
    process.exit(1);
  }
}

// エラーハンドリング
process.on("unhandledRejection", (error) => {
  logger.error(tDefault("system:web.unhandled_rejection"), error);
});

process.on("uncaughtException", (error) => {
  logger.error(tDefault("system:web.uncaught_exception"), error);
  process.exit(1);
});

// 起動
startWebServer().catch((error) => {
  logger.error(tDefault("system:web.startup_failed"), error);
  process.exit(1);
});
