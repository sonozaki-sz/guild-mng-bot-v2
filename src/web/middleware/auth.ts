// src/web/middleware/auth.ts
// Web API ベアラートークン認証プラグイン

import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../shared/config";
import { tDefault } from "../../shared/locale";
import { logger } from "../../shared/utils";

/**
 * API 認証ミドルウェア（Fastify プラグイン）
 *
 * 動作:
 * - API_KEY（JWT_SECRET 環境変数）が設定されていない場合は認証をスキップ（開発環境前提）
 * - 設定されている場合は `Authorization: Bearer <API_KEY>` を必須とする
 *
 * 現在の実装はAPIキーとの単純な文字列一致であり、JWT署名検証や有効期限チェックは行っていない。
 * 本格的なJWT検証が必要になった場合は、この関数内の検証ロジックを
 * jsonwebtoken などに差し替えること。
 */
export const apiAuthPlugin: FastifyPluginAsync = async (fastify) => {
  // すべての受信リクエストで認証判定を行う
  fastify.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // JWT_SECRET 未設定の場合は認証スキップ（開発環境のみを想定）
      if (!env.JWT_SECRET) {
        return;
      }

      // Authorization ヘッダーを取得してBearer形式を検証
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn(
          tDefault("system:web.auth_unauthorized", {
            method: request.method,
            url: request.url,
          }),
        );
        await reply.status(401).send({
          error: tDefault("system:web.auth_unauthorized_error"),
          message: tDefault("system:web.auth_header_required"),
        });
        return;
      }

      // Bearer プレフィックスを除去した実トークン値
      const token = authHeader.slice(7).trim();

      // APIキーと一致するか確認（単純なAPIキー認証）
      // 本格的なJWT検証が必要な場合はここを差し替える
      if (token !== env.JWT_SECRET) {
        logger.warn(
          tDefault("system:web.auth_invalid_token", {
            method: request.method,
            url: request.url,
          }),
        );
        await reply.status(403).send({
          error: tDefault("system:web.auth_forbidden_error"),
          message: tDefault("system:web.auth_invalid_token_message"),
        });
        return;
      }

      // ここに到達した場合のみ認証成功として後続ハンドラへ進む
    },
  );
};
