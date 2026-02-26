// tests/unit/web/webAppBuilder.test.ts
// 環境(development/production)に応じたFastifyプラグイン登録・ルート設定・
// CORSポリシー・エラーハンドラの挙動を検証するグループ
describe("web/webAppBuilder", () => {
  // vi.resetModules()でモジュールキャッシュを初期化し、環境変数同士で異なるインスタンスを取得する
  const setup = async (options: {
    nodeEnv: "development" | "production";
    corsOrigin?: string;
  }) => {
    vi.resetModules();

    const fastifyInstance = {
      register: vi.fn().mockResolvedValue(undefined),
      setErrorHandler: vi.fn(),
    };
    const fastifyFactory = vi.fn(() => fastifyInstance);
    const corsPlugin = vi.fn();
    const staticPlugin = vi.fn();
    const apiRoutes = vi.fn();
    const healthRoute = vi.fn();
    const logger = { error: vi.fn() };
    const tDefault = vi.fn((key: string) => `tr:${key}`);

    vi.doMock("fastify", () => ({
      __esModule: true,
      default: fastifyFactory,
    }));
    vi.doMock("@fastify/cors", () => ({
      __esModule: true,
      default: corsPlugin,
    }));
    vi.doMock("@fastify/static", () => ({
      __esModule: true,
      default: staticPlugin,
    }));
    vi.doMock("@/web/routes/api/apiRoutes", () => ({ apiRoutes }));
    vi.doMock("@/web/routes/health", () => ({ healthRoute }));
    vi.doMock("@/shared/locale/localeManager", () => ({ tDefault }));
    vi.doMock("@/shared/utils/logger", () => ({ logger }));
    vi.doMock("@/shared/config/env", () => ({
      NODE_ENV: {
        DEVELOPMENT: "development",
        PRODUCTION: "production",
        TEST: "test",
      },
      env: {
        NODE_ENV: options.nodeEnv,
        CORS_ORIGIN: options.corsOrigin,
      },
    }));

    const module = await import("@/web/webAppBuilder");

    return {
      module,
      fastifyInstance,
      corsPlugin,
      staticPlugin,
      apiRoutes,
      healthRoute,
      logger,
      tDefault,
    };
  };

  it("registers plugins/routes and returns fastify instance in development", async () => {
    const {
      module,
      fastifyInstance,
      corsPlugin,
      staticPlugin,
      apiRoutes,
      healthRoute,
    } = await setup({ nodeEnv: "development" });

    const app = await module.buildWebApp("/tmp/base");
    expect(app).toBe(fastifyInstance);

    expect(fastifyInstance.register).toHaveBeenCalledWith(corsPlugin, {
      origin: true,
      credentials: true,
    });
    expect(fastifyInstance.register).toHaveBeenCalledWith(
      staticPlugin,
      expect.objectContaining({ prefix: "/" }),
    );
    expect(fastifyInstance.register).toHaveBeenCalledWith(healthRoute);
    expect(fastifyInstance.register).toHaveBeenCalledWith(apiRoutes, {
      prefix: "/api",
    });
    expect(fastifyInstance.setErrorHandler).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  // productionではCORS_ORIGINのカンマ区切り文字列が配列に変換され、エラーハンドラが内部エラー詳細をクライアントに漏洗しないことを確認
  it("uses origin allow-list in production and hides internal error message", async () => {
    const { module, fastifyInstance, logger, tDefault } = await setup({
      nodeEnv: "production",
      corsOrigin: "https://a.example, https://b.example",
    });

    await module.buildWebApp("/tmp/base");

    expect(fastifyInstance.register).toHaveBeenCalledWith(
      expect.any(Function),
      {
        origin: ["https://a.example", "https://b.example"],
        credentials: true,
      },
    );

    const handler = fastifyInstance.setErrorHandler.mock.calls[0][0] as (
      error: Error & { statusCode?: number },
      request: { url: string; method: string },
      reply: {
        status: (code: number) => { send: (payload: unknown) => void };
      },
    ) => void;

    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    handler(
      Object.assign(new Error("internal details"), { statusCode: 418 }),
      { url: "/api/test", method: "GET" },
      { status },
    );

    expect(logger.error).toHaveBeenCalledWith("tr:system:web.api_error", {
      error: "internal details",
      stack: expect.any(String),
      url: "/api/test",
      method: "GET",
    });
    expect(status).toHaveBeenCalledWith(418);
    expect(send).toHaveBeenCalledWith({
      error: "tr:system:web.internal_server_error",
      message: undefined,
    });
    expect(tDefault).toHaveBeenCalledWith("system:web.api_error");
  });

  // 開発環境ではエラーハンドラーが message をそのままレスポンスに含めることでデバッグしやすくすることを確認
  it("returns detailed message from error handler in development", async () => {
    const { module, fastifyInstance } = await setup({ nodeEnv: "development" });
    await module.buildWebApp("/tmp/base");

    const handler = fastifyInstance.setErrorHandler.mock.calls[0][0] as (
      error: Error & { statusCode?: number },
      request: { url: string; method: string },
      reply: {
        status: (code: number) => { send: (payload: unknown) => void };
      },
    ) => void;

    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    handler(
      new Error("debug-visible"),
      { url: "/x", method: "POST" },
      { status },
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      error: "tr:system:web.internal_server_error",
      message: "debug-visible",
    });
  });

  // CORS_ORIGINが未設定の場合は空配列が設定され、全オリジンからのクロスオリジンリクエストが拒否されることを確認
  it("uses empty allow-list when CORS_ORIGIN is undefined in production", async () => {
    const { module, fastifyInstance } = await setup({
      nodeEnv: "production",
      corsOrigin: undefined,
    });

    await module.buildWebApp("/tmp/base");

    expect(fastifyInstance.register).toHaveBeenCalledWith(
      expect.any(Function),
      {
        origin: [],
        credentials: true,
      },
    );
  });
});
