// src/web/routes/health.ts
// ヘルスチェックエンドポイント

import { FastifyPluginAsync } from 'fastify';

export const healthRoute: FastifyPluginAsync = async (fastify) => {
    fastify.get('/health', async (request, reply) => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    });

    fastify.get('/ready', async (request, reply) => {
        // データベース接続チェックなど
        return { ready: true };
    });
};
