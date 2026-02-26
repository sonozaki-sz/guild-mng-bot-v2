// tests/unit/web/middleware/auth.test.ts
let jwtSecretValue: string | undefined;

// auth ミドルウェア内で参照される env をテスト用に差し替える
vi.mock("@/shared/config/env", () => ({
  NODE_ENV: {
    DEVELOPMENT: "development",
    PRODUCTION: "production",
    TEST: "test",
  },
  env: {
    NODE_ENV: "test",
    LOCALE: "ja",
    LOG_LEVEL: "error",
    get JWT_SECRET() {
      return jwtSecretValue;
    },
  },
}));

import type { Mock } from "vitest";
import { apiAuthPlugin } from "@/web/middleware/auth";

describe("web/middleware/auth apiAuthPlugin", () => {
  // Authorizationヘッダー検証とトークン一致判定の分岐を検証
  // テスト間でシークレット状態が残らないように初期化
  afterEach(() => {
    jwtSecretValue = undefined;
  });

  // プラグイン登録時に設定される onRequest フックを取り出す
  async function setupHook() {
    const addHook = vi.fn();
    const fastify = {
      addHook,
    };

    await apiAuthPlugin(fastify as never, {} as never);

    expect(addHook).toHaveBeenCalledTimes(1);
    expect(addHook.mock.calls[0][0]).toBe("onRequest");

    return addHook.mock.calls[0][1] as (
      request: {
        headers: { authorization?: string };
        method: string;
        url: string;
      },
      reply: { status: Mock; send: Mock },
    ) => Promise<void>;
  }

  // FastifyReply 互換の最小モックを生成
  function createReply() {
    return {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockResolvedValue(undefined),
    };
  }

  it("skips auth when JWT_SECRET is not configured", async () => {
    jwtSecretValue = undefined;
    const onRequest = await setupHook();
    const reply = createReply();

    await onRequest({ headers: {}, method: "GET", url: "/protected" }, reply);

    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is missing", async () => {
    // 認証ヘッダー欠落時は 401 を返す
    jwtSecretValue = "secret-token";
    const onRequest = await setupHook();
    const reply = createReply();

    await onRequest({ headers: {}, method: "GET", url: "/protected" }, reply);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledTimes(1);
    const unauthorizedPayload = reply.send.mock.calls[0][0] as {
      error?: unknown;
      message?: unknown;
    };
    expect(
      Object.prototype.hasOwnProperty.call(unauthorizedPayload, "error"),
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(unauthorizedPayload, "message"),
    ).toBe(true);
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    // Bearer 形式でないヘッダーは 401 扱い
    jwtSecretValue = "secret-token";
    const onRequest = await setupHook();
    const reply = createReply();

    await onRequest(
      {
        headers: { authorization: "Basic abc" },
        method: "GET",
        url: "/protected",
      },
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalled();
  });

  it("returns 403 when Bearer token is invalid", async () => {
    // Bearer 形式でもトークン不一致なら 403 を返す
    jwtSecretValue = "secret-token";
    const onRequest = await setupHook();
    const reply = createReply();

    await onRequest(
      {
        headers: { authorization: "Bearer wrong-token" },
        method: "GET",
        url: "/protected",
      },
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledTimes(1);
    const forbiddenPayload = reply.send.mock.calls[0][0] as {
      error?: unknown;
      message?: unknown;
    };
    expect(
      Object.prototype.hasOwnProperty.call(forbiddenPayload, "error"),
    ).toBe(true);
    expect(
      Object.prototype.hasOwnProperty.call(forbiddenPayload, "message"),
    ).toBe(true);
  });

  it("allows request when Bearer token is valid", async () => {
    // 正しいトークン時はミドルウェアが応答を返さず通過させる
    jwtSecretValue = "secret-token";
    const onRequest = await setupHook();
    const reply = createReply();

    await onRequest(
      {
        headers: { authorization: "Bearer secret-token" },
        method: "GET",
        url: "/protected",
      },
      reply,
    );

    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });
});
