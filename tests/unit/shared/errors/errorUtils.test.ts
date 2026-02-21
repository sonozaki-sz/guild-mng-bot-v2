describe("shared/errors/errorUtils", () => {
  const warnMock = vi.fn();
  const errorMock = vi.fn();
  const tDefaultMock = vi.fn(
    (key: string, params?: { message?: string }) =>
      `${key}${params?.message ? `:${params.message}` : ""}`,
  );

  const loadModule = async (nodeEnv: "development" | "production" | "test") => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.doMock("@/shared/config/env", () => ({
      NODE_ENV: {
        DEVELOPMENT: "development",
        PRODUCTION: "production",
        TEST: "test",
      },
      env: {
        NODE_ENV: nodeEnv,
      },
    }));

    vi.doMock("@/shared/locale/localeManager", () => ({
      tDefault: (key: string, params?: { message?: string }) =>
        tDefaultMock(key, params),
    }));

    vi.doMock("@/shared/utils/logger", () => ({
      logger: {
        warn: (...args: unknown[]) => warnMock(...args),
        error: (...args: unknown[]) => errorMock(...args),
      },
    }));

    const errorUtils = await import("@/shared/errors/errorUtils");
    const { BaseError } = await import("@/shared/errors/customErrors");

    return { errorUtils, BaseError };
  };

  it("toError returns Error/BaseError as-is and converts unknown values", async () => {
    const { errorUtils, BaseError } = await loadModule("test");
    const base = new BaseError("ValidationError", "invalid", true);
    const normal = new Error("boom");

    expect(errorUtils.toError(base)).toBe(base);
    expect(errorUtils.toError(normal)).toBe(normal);

    const converted = errorUtils.toError(123);
    expect(converted).toBeInstanceOf(Error);
    expect(converted.message).toBe("123");
  });

  it("logError writes warn for operational BaseError and error otherwise", async () => {
    const { errorUtils, BaseError } = await loadModule("test");
    const operational = new BaseError("ValidationError", "invalid", true, 400);
    const nonOperational = new BaseError(
      "DatabaseError",
      "db down",
      false,
      500,
    );

    errorUtils.logError(operational);
    expect(warnMock).toHaveBeenCalledWith(
      "[ValidationError] invalid",
      expect.objectContaining({ statusCode: 400 }),
    );

    errorUtils.logError(nonOperational);
    expect(errorMock).toHaveBeenCalledWith(
      "[DatabaseError] db down",
      expect.objectContaining({ statusCode: 500 }),
    );

    errorUtils.logError(new Error("unhandled"));
    expect(errorMock).toHaveBeenCalledWith(
      "[UnhandledError] unhandled",
      expect.objectContaining({ stack: expect.anything() }),
    );
  });

  it("getUserFriendlyMessage returns operational message and env-specific fallback", async () => {
    const testModule = await loadModule("test");
    const op = new testModule.BaseError(
      "ValidationError",
      "user message",
      true,
    );
    expect(testModule.errorUtils.getUserFriendlyMessage(op)).toBe(
      "user message",
    );

    const prodModule = await loadModule("production");
    expect(
      prodModule.errorUtils.getUserFriendlyMessage(new Error("secret")),
    ).toBe("errors:general.unexpected_production");

    const devModule = await loadModule("development");
    expect(
      devModule.errorUtils.getUserFriendlyMessage(new Error("detail")),
    ).toBe("errors:general.unexpected_with_message:detail");
  });
});
