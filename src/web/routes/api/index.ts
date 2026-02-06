// src/web/routes/api/index.ts
// APIルート

import type { FastifyPluginAsync } from "fastify";

export const apiRoutes: FastifyPluginAsync = async (fastify) => {
  // TODO: APIルートをここに追加
  fastify.get("/", async () => {
    return {
      message: "Guild Management Bot API",
      version: "2.0.0",
    };
  });
};
