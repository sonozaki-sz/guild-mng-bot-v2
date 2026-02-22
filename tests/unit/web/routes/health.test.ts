import Fastify from "fastify";

// Prisma クライアント取得処理を差し替えるモック
const getPrismaClientMock = vi.fn();

vi.mock("@/shared/utils/prisma", () => ({
  getPrismaClient: () => getPrismaClientMock(),
}));

import { healthRoute } from "@/web/routes/health";

describe("web/routes/health", () => {
  // ヘルス/レディネスAPIの成功・失敗分岐を検証
  // 各テストでモック状態をリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /health returns status payload", async () => {
    // ルート登録済みの Fastify インスタンスを作成
    const app = Fastify();
    await app.register(healthRoute);

    // ヘルスチェックの基本レスポンスを検証
    const res = await app.inject({ method: "GET", url: "/health" });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.uptime).toBe("number");

    await app.close();
  });

  it("GET /ready returns 503 when prisma is not initialized", async () => {
    // Prisma 未初期化の分岐
    getPrismaClientMock.mockReturnValueOnce(null);

    const app = Fastify();
    await app.register(healthRoute);

    const res = await app.inject({ method: "GET", url: "/ready" });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({
      ready: false,
      reason: "Database not initialized",
    });

    await app.close();
  });

  it("GET /ready returns ready true when query succeeds", async () => {
    // 疎通クエリ成功時の分岐
    const queryRaw = vi.fn().mockResolvedValueOnce([{ value: 1 }]);
    getPrismaClientMock.mockReturnValueOnce({
      $queryRaw: queryRaw,
    });

    const app = Fastify();
    await app.register(healthRoute);

    const res = await app.inject({ method: "GET", url: "/ready" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ready: true });
    expect(queryRaw).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it("GET /ready returns 503 when query fails", async () => {
    // 疎通クエリ失敗時の分岐
    const queryRaw = vi.fn().mockRejectedValueOnce(new Error("db down"));
    getPrismaClientMock.mockReturnValueOnce({
      $queryRaw: queryRaw,
    });

    const app = Fastify();
    await app.register(healthRoute);

    const res = await app.inject({ method: "GET", url: "/ready" });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({
      ready: false,
      reason: "Database connection failed",
    });

    await app.close();
  });
});
