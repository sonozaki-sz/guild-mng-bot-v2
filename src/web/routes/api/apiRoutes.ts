// src/web/routes/api/apiRoutes.ts
// APIルート

import type { FastifyPluginAsync } from "fastify";
import { apiAuthPlugin } from "../../middleware/auth";

export const apiRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(apiAuthPlugin);

  fastify.get("/", async () => {
    return {
      message: "Ayasono API",
      version: "2.0.0",
    };
  });
};
