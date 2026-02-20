// src/web/routes/health.ts
// ヘルスチェックエンドポイント

import { FastifyPluginAsync } from "fastify";
import { getPrismaClient } from "../../shared/utils";

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  // プロセス生存確認用（依存先状態は問わない）
  fastify.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // 起動準備完了確認用（依存先の疎通を含む）
  fastify.get("/ready", async (_, reply) => {
    // Prisma 初期化前は ready=false
    const prisma = getPrismaClient();
    if (!prisma) {
      return reply.status(503).send({
        ready: false,
        reason: "Database not initialized",
      });
    }
    try {
      // 実際にDBへ疎通確認
      await prisma.$queryRaw`SELECT 1`;
      // クエリ成功時のみ ready=true を返す
      return { ready: true };
    } catch {
      // DB不達時は 503 で非準備状態を返す
      return reply.status(503).send({
        ready: false,
        reason: "Database connection failed",
      });
    }
  });
};
