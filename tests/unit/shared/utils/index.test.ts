// tests/unit/shared/utils/index.test.ts
describe("shared/utils modules", () => {
  it("exports utility functions and logger from direct modules", async () => {
    const errorHandlingModule = await import("@/shared/utils/errorHandling");
    const loggerModule = await import("@/shared/utils/logger");
    const prismaModule = await import("@/shared/utils/prisma");

    expect(errorHandlingModule.executeWithDatabaseError).toEqual(
      expect.any(Function),
    );
    expect(errorHandlingModule.executeWithLoggedError).toEqual(
      expect.any(Function),
    );
    expect(loggerModule.logger).toBeDefined();
    expect(prismaModule.getPrismaClient).toEqual(expect.any(Function));
    expect(prismaModule.requirePrismaClient).toEqual(expect.any(Function));
    expect(prismaModule.setPrismaClient).toEqual(expect.any(Function));
  });
});
