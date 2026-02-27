// tests/unit/shared/utils/prisma.test.ts
describe("shared/utils/prisma", () => {
  const loggerMock = {
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.doMock("@/shared/utils/logger", () => ({
      logger: loggerMock,
    }));

    vi.doMock("@/shared/locale/localeManager", () => ({
      tDefault: vi.fn((key: string) => key),
    }));
  });

  it("returns null before client is initialized", async () => {
    const { getPrismaClient } = await import("@/shared/utils/prisma");
    expect(getPrismaClient()).toBeNull();
  });

  it("stores and returns initialized prisma client", async () => {
    const { getPrismaClient, setPrismaClient } =
      await import("@/shared/utils/prisma");
    const client = { $disconnect: vi.fn() };

    setPrismaClient(client as never);

    expect(getPrismaClient()).toBe(client);
  });

  it("returns initialized client via requirePrismaClient", async () => {
    const { requirePrismaClient, setPrismaClient } =
      await import("@/shared/utils/prisma");
    const client = { $connect: vi.fn() };
    setPrismaClient(client as never);

    expect(requirePrismaClient()).toBe(client);
  });

  it("throws and logs when requirePrismaClient is called before initialization", async () => {
    const { requirePrismaClient } = await import("@/shared/utils/prisma");

    expect(() => requirePrismaClient()).toThrow("system:database.prisma_not_available");
    expect(loggerMock.error).toHaveBeenCalledWith(
      "system:database.prisma_not_available",
      expect.any(Error),
    );
  });
});
