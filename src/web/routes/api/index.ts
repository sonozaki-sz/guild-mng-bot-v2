// src/web/routes/api/index.ts
// APIルート

import type { FastifyPluginAsync } from "fastify";
import { apiAuthPlugin } from "../../middleware/auth";

export const apiRoutes: FastifyPluginAsync = async (fastify) => {
  // この配下に登録される全APIへ認証フックを適用
  await fastify.register(apiAuthPlugin);

  // ルート生存確認用の最小エンドポイント
  fastify.get("/", async () => {
    return {
      message: "Guild Management Bot API",
      version: "2.0.0",
    };
  });
};
