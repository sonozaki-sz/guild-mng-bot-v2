describe("shared/utils/prisma", () => {
  const loggerMock = {
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.doMock("@/shared/utils/logger", () => ({
      logger: loggerMock,
    }));
  });

  it("returns null before client is initialized", async () => {
    const { getPrismaClient } = await import("@/shared/utils/prisma");
    expect(getPrismaClient()).toBeNull();
  });

  it("stores and returns initialized prisma client", async () => {
    const { getPrismaClient, setPrismaClient } =
      await import("@/shared/utils/prisma");
    const client = { $disconnect: jest.fn() };

    setPrismaClient(client as never);

    expect(getPrismaClient()).toBe(client);
  });

  it("returns initialized client via requirePrismaClient", async () => {
    const { requirePrismaClient, setPrismaClient } =
      await import("@/shared/utils/prisma");
    const client = { $connect: jest.fn() };
    setPrismaClient(client as never);

    expect(requirePrismaClient()).toBe(client);
  });

  it("throws and logs when requirePrismaClient is called before initialization", async () => {
    const { requirePrismaClient } = await import("@/shared/utils/prisma");

    expect(() => requirePrismaClient()).toThrow("Prisma client not available");
    expect(loggerMock.error).toHaveBeenCalledWith(
      "Prisma client not available",
    );
  });
});
