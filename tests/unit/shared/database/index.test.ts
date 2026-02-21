describe("shared/database/index", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("throws when repository is not initialized and no prisma is provided", async () => {
    const createGuildConfigRepositoryMock = jest.fn();
    jest.doMock("@/shared/database/repositories/guildConfigRepository", () => ({
      createGuildConfigRepository: createGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/database");
    expect(() => module.getGuildConfigRepository()).toThrow(
      "GuildConfigRepository is not initialized",
    );
  });

  it("creates repository once per prisma instance and reuses cache", async () => {
    const repoA = { id: "repoA" };
    const repoB = { id: "repoB" };
    const prismaA = { id: "prismaA" };
    const prismaB = { id: "prismaB" };
    const createGuildConfigRepositoryMock = jest.fn((prisma: unknown) =>
      prisma === prismaA ? repoA : repoB,
    );

    jest.doMock("@/shared/database/repositories/guildConfigRepository", () => ({
      createGuildConfigRepository: createGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/database");

    const firstA = module.getGuildConfigRepository(prismaA as never);
    const secondA = module.getGuildConfigRepository(prismaA as never);
    const firstB = module.getGuildConfigRepository(prismaB as never);

    expect(firstA).toBe(repoA);
    expect(secondA).toBe(repoA);
    expect(firstB).toBe(repoB);
    expect(createGuildConfigRepositoryMock).toHaveBeenCalledTimes(2);
    expect(createGuildConfigRepositoryMock).toHaveBeenNthCalledWith(1, prismaA);
    expect(createGuildConfigRepositoryMock).toHaveBeenNthCalledWith(2, prismaB);
  });

  it("stores default repository from prisma path and supports explicit default override", async () => {
    const repoFromPrisma = { id: "repoFromPrisma" };
    const explicitDefault = { id: "explicitDefault" };
    const prisma = { id: "prisma" };
    const createGuildConfigRepositoryMock = jest.fn(() => repoFromPrisma);

    jest.doMock("@/shared/database/repositories/guildConfigRepository", () => ({
      createGuildConfigRepository: createGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/database");

    module.getGuildConfigRepository(prisma as never);
    expect(module.getGuildConfigRepository()).toBe(repoFromPrisma);

    module.setDefaultGuildConfigRepository(explicitDefault as never);
    expect(module.getGuildConfigRepository()).toBe(explicitDefault);
  });

  it("clears cached and default repositories on reset", async () => {
    const repoFromPrisma = { id: "repoFromPrisma" };
    const prisma = { id: "prisma" };
    const createGuildConfigRepositoryMock = jest.fn(() => repoFromPrisma);

    jest.doMock("@/shared/database/repositories/guildConfigRepository", () => ({
      createGuildConfigRepository: createGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/database");

    module.getGuildConfigRepository(prisma as never);
    module.resetGuildConfigRepositoryCache();

    expect(() => module.getGuildConfigRepository()).toThrow(
      "GuildConfigRepository is not initialized",
    );
  });
});
