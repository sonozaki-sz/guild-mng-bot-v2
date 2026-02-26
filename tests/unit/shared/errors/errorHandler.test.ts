// tests/unit/shared/errors/errorHandler.test.ts
describe("shared/errors/errorHandler", () => {
  it("re-exports error utils and process handlers", async () => {
    const indexModule = await import("@/shared/errors/errorHandler");
    const errorUtilsModule = await import("@/shared/errors/errorUtils");
    const processModule = await import("@/shared/errors/processErrorHandler");

    expect(indexModule.getUserFriendlyMessage).toBe(
      errorUtilsModule.getUserFriendlyMessage,
    );
    expect(indexModule.logError).toBe(errorUtilsModule.logError);
    expect(indexModule.toError).toBe(errorUtilsModule.toError);
    expect(indexModule.setupGlobalErrorHandlers).toBe(
      processModule.setupGlobalErrorHandlers,
    );
    expect(indexModule.setupGracefulShutdown).toBe(
      processModule.setupGracefulShutdown,
    );
  });
});
