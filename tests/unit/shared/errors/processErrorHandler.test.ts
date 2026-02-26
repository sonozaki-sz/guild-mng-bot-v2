// tests/unit/shared/errors/processErrorHandler.test.ts
// process イベントハンドラの登録・重複防止・エラー分類・グレースフルシャットダウンの正確な動作を検証
describe("shared/errors/processErrorHandler", () => {
  const tDefaultMock = vi.fn(
    (key: string, options?: { signal?: string }) =>
      `${key}${options?.signal ? `:${options.signal}` : ""}`,
  );
  const loggerMock = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };
  const logErrorMock = vi.fn();

  // vi.doMock は vi.resetModules() 後に有効なので、各テストで独立したモックが得られるよう毎回リセットする
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.doMock("@/shared/locale/localeManager", () => ({
      tDefault: tDefaultMock,
    }));
    vi.doMock("@/shared/utils/logger", () => ({
      logger: loggerMock,
    }));
    vi.doMock("@/shared/errors/errorUtils", () => ({
      logError: logErrorMock,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers global handlers only once", async () => {
    const onSpy = vi
      .spyOn(process, "on")
      .mockImplementation((() => process) as typeof process.on);
    const { setupGlobalErrorHandlers } =
      await import("@/shared/errors/processErrorHandler");

    setupGlobalErrorHandlers();
    setupGlobalErrorHandlers();

    expect(onSpy).toHaveBeenCalledTimes(3);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      "Global error handlers already registered, skipping.",
    );
  });

  it("logs unhandled rejection and forwards Error reason", async () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      listener: (...args: unknown[]) => void,
    ) => {
      handlers.set(event, listener);
      return process;
    }) as typeof process.on);

    const { setupGlobalErrorHandlers } =
      await import("@/shared/errors/processErrorHandler");
    setupGlobalErrorHandlers();

    const unhandledRejection = handlers.get("unhandledRejection");
    expect(unhandledRejection).toBeDefined();

    const reason = new Error("boom");
    const promise = Promise.resolve("ok");
    unhandledRejection?.(reason, promise);

    expect(loggerMock.error).toHaveBeenCalledWith(
      "system:error.unhandled_rejection_log",
      {
        reason,
        promise,
      },
    );
    expect(logErrorMock).toHaveBeenCalledWith(reason);

    unhandledRejection?.("string-reason", promise);
    expect(logErrorMock).toHaveBeenCalledTimes(1);
  });

  // non-operational （回復不可能なエラー）の場合はプロセス終了すること・ operational なら終了しないことを検証
  it("exits on non-operational BaseError from uncaughtException", async () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      listener: (...args: unknown[]) => void,
    ) => {
      handlers.set(event, listener);
      return process;
    }) as typeof process.on);
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined as never) as typeof process.exit);

    const { BaseError } = await import("@/shared/errors/customErrors");
    const { setupGlobalErrorHandlers } =
      await import("@/shared/errors/processErrorHandler");
    setupGlobalErrorHandlers();

    const uncaughtException = handlers.get("uncaughtException");
    expect(uncaughtException).toBeDefined();

    const fatal = new BaseError("FatalError", "fatal", false);
    uncaughtException?.(fatal);

    expect(loggerMock.error).toHaveBeenCalledWith(
      "system:error.uncaught_exception_log",
      fatal,
    );
    expect(logErrorMock).toHaveBeenCalledWith(fatal);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("does not exit on operational BaseError from uncaughtException", async () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      listener: (...args: unknown[]) => void,
    ) => {
      handlers.set(event, listener);
      return process;
    }) as typeof process.on);
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined as never) as typeof process.exit);

    const { BaseError } = await import("@/shared/errors/customErrors");
    const { setupGlobalErrorHandlers } =
      await import("@/shared/errors/processErrorHandler");
    setupGlobalErrorHandlers();

    const uncaughtException = handlers.get("uncaughtException");
    const operational = new BaseError("ValidationError", "invalid", true);
    uncaughtException?.(operational);

    expect(logErrorMock).toHaveBeenCalledWith(operational);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("logs node warning details from warning event", async () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      listener: (...args: unknown[]) => void,
    ) => {
      handlers.set(event, listener);
      return process;
    }) as typeof process.on);

    const { setupGlobalErrorHandlers } =
      await import("@/shared/errors/processErrorHandler");
    setupGlobalErrorHandlers();

    const warningHandler = handlers.get("warning");
    expect(warningHandler).toBeDefined();

    const warning = new Error("node warning");
    warning.name = "ExperimentalWarning";
    warningHandler?.(warning);

    expect(loggerMock.warn).toHaveBeenCalledWith(
      "system:error.node_warning",
      expect.objectContaining({
        name: "ExperimentalWarning",
        message: "node warning",
        stack: expect.any(String),
      }),
    );
  });

  it("logs DEP0040 DeprecationWarning (no longer in ignore list)", async () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      listener: (...args: unknown[]) => void,
    ) => {
      handlers.set(event, listener);
      return process;
    }) as typeof process.on);

    const { setupGlobalErrorHandlers } =
      await import("@/shared/errors/processErrorHandler");
    setupGlobalErrorHandlers();

    const warningHandler = handlers.get("warning");
    expect(warningHandler).toBeDefined();

    const deprecation = Object.assign(
      new Error("The `punycode` module is deprecated."),
      {
        name: "DeprecationWarning",
        code: "DEP0040",
      },
    );
    warningHandler?.(deprecation);

    // DEP0040 は無視リストにないため warn が呼ばれること
    // （外部ライブラリ由来の警告であり、Node.js stderr への出力を維持する）
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: "DeprecationWarning",
        message: "The `punycode` module is deprecated.",
      }),
    );
  });

  it("logs DeprecationWarning when code is not in the ignore list", async () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      listener: (...args: unknown[]) => void,
    ) => {
      handlers.set(event, listener);
      return process;
    }) as typeof process.on);

    const { setupGlobalErrorHandlers } =
      await import("@/shared/errors/processErrorHandler");
    setupGlobalErrorHandlers();

    const warningHandler = handlers.get("warning");
    expect(warningHandler).toBeDefined();

    const unknownDeprecation = Object.assign(
      new Error("Some unknown deprecation"),
      {
        name: "DeprecationWarning",
        code: "DEP9999",
      },
    );
    warningHandler?.(unknownDeprecation);

    // DEP9999 は無視リストにないため warn が呼ばれること
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: "DeprecationWarning",
        message: "Some unknown deprecation",
      }),
    );
  });

  it("logs DeprecationWarning when code is undefined (null-coalescing fallback)", async () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    vi.spyOn(process, "on").mockImplementation(((
      event: string,
      listener: (...args: unknown[]) => void,
    ) => {
      handlers.set(event, listener);
      return process;
    }) as typeof process.on);

    const { setupGlobalErrorHandlers } =
      await import("@/shared/errors/processErrorHandler");
    setupGlobalErrorHandlers();

    const warningHandler = handlers.get("warning");
    expect(warningHandler).toBeDefined();

    // code プロパティが未定義の場合 warning.code ?? "" → "" → not in ignore list
    const deprecationNoCode = Object.assign(
      new Error("Some deprecation without code"),
      { name: "DeprecationWarning" },
      // code is intentionally absent (undefined)
    );
    warningHandler?.(deprecationNoCode);

    // code が undefined のため無視リストに含まれず warn が呼ばれること
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: "DeprecationWarning",
      }),
    );
  });

  // グレースフルシャットダウンのクリーンアップ成功・失敗後の exit コードとログ、および二重登録防止を一つの IT で網羅的に検証
  it("registers graceful shutdown once and handles cleanup outcomes", async () => {
    const onceHandlers = new Map<string, () => void>();
    vi.spyOn(process, "once").mockImplementation(((
      event: string,
      listener: () => void,
    ) => {
      onceHandlers.set(event, listener);
      return process;
    }) as typeof process.once);
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined as never) as typeof process.exit);

    const { setupGracefulShutdown } =
      await import("@/shared/errors/processErrorHandler");

    const cleanup = vi.fn().mockResolvedValue(undefined);
    setupGracefulShutdown(cleanup);
    setupGracefulShutdown(cleanup);

    expect(loggerMock.warn).toHaveBeenCalledWith(
      "Graceful shutdown handlers already registered, skipping.",
    );

    onceHandlers.get("SIGTERM")?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith(
      "system:shutdown.signal_received:SIGTERM",
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      "system:error.cleanup_complete",
    );
    expect(exitSpy).toHaveBeenCalledWith(0);

    const failingCleanup = vi
      .fn()
      .mockRejectedValue(new Error("cleanup-failed"));
    vi.resetModules();
    vi.clearAllMocks();
    vi.doMock("@/shared/locale/localeManager", () => ({
      tDefault: tDefaultMock,
    }));
    vi.doMock("@/shared/utils/logger", () => ({
      logger: loggerMock,
    }));
    vi.doMock("@/shared/errors/errorUtils", () => ({
      logError: logErrorMock,
    }));

    const secondOnceHandlers = new Map<string, () => void>();
    vi.spyOn(process, "once").mockImplementation(((
      event: string,
      listener: () => void,
    ) => {
      secondOnceHandlers.set(event, listener);
      return process;
    }) as typeof process.once);
    const secondExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined as never) as typeof process.exit);

    const { setupGracefulShutdown: setupGracefulShutdown2 } =
      await import("@/shared/errors/processErrorHandler");

    setupGracefulShutdown2(failingCleanup);
    secondOnceHandlers.get("SIGINT")?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(loggerMock.error).toHaveBeenCalledWith(
      "system:error.cleanup_failed",
      expect.any(Error),
    );
    expect(secondExitSpy).toHaveBeenCalledWith(1);
  });

  // シャットダウン中に同じシグナルが再度山るケース: 二重処理を防いで warn だけ出すことを検証
  it("logs already-shutting-down warning when signal arrives again", async () => {
    const onceHandlers = new Map<string, () => void>();
    vi.spyOn(process, "once").mockImplementation(((
      event: string,
      listener: () => void,
    ) => {
      onceHandlers.set(event, listener);
      return process;
    }) as typeof process.once);
    vi.spyOn(process, "exit").mockImplementation(
      (() => undefined as never) as typeof process.exit,
    );

    let resolveCleanup: (() => void) | undefined;
    const cleanup = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCleanup = resolve;
        }),
    );

    const { setupGracefulShutdown } =
      await import("@/shared/errors/processErrorHandler");
    setupGracefulShutdown(cleanup);

    const sigterm = onceHandlers.get("SIGTERM");
    expect(sigterm).toBeDefined();

    sigterm?.();
    sigterm?.();
    await Promise.resolve();

    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining("(already shutting down)"),
    );

    resolveCleanup?.();
    await Promise.resolve();
  });

  it("exits successfully even when cleanup is not provided", async () => {
    const onceHandlers = new Map<string, () => void>();
    vi.spyOn(process, "once").mockImplementation(((
      event: string,
      listener: () => void,
    ) => {
      onceHandlers.set(event, listener);
      return process;
    }) as typeof process.once);
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined as never) as typeof process.exit);

    const { setupGracefulShutdown } =
      await import("@/shared/errors/processErrorHandler");
    setupGracefulShutdown();

    onceHandlers.get("SIGINT")?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(loggerMock.info).toHaveBeenCalledWith(
      "system:error.cleanup_complete",
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
