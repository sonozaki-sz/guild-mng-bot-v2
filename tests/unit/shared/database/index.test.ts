describe("shared/database/guildConfigRepositoryProvider", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when repository is not initialized and no prisma is provided", async () => {
    const createGuildConfigRepositoryMock = vi.fn();
    vi.doMock("@/shared/database/repositories/guildConfigRepository", () => ({
      createGuildConfigRepository: createGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/database/guildConfigRepositoryProvider");
    expect(() => module.getGuildConfigRepository()).toThrow(
      "GuildConfigRepository is not initialized",
    );
  });

  it("creates repository once per prisma instance and reuses cache", async () => {
    const repoA = { id: "repoA" };
    const repoB = { id: "repoB" };
    const prismaA = { id: "prismaA" };
    const prismaB = { id: "prismaB" };
    const createGuildConfigRepositoryMock = vi.fn((prisma: unknown) =>
      prisma === prismaA ? repoA : repoB,
    );

    vi.doMock("@/shared/database/repositories/guildConfigRepository", () => ({
      createGuildConfigRepository: createGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/database/guildConfigRepositoryProvider");

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
    const createGuildConfigRepositoryMock = vi.fn(() => repoFromPrisma);

    vi.doMock("@/shared/database/repositories/guildConfigRepository", () => ({
      createGuildConfigRepository: createGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/database/guildConfigRepositoryProvider");

    module.getGuildConfigRepository(prisma as never);
    expect(module.getGuildConfigRepository()).toBe(repoFromPrisma);

    module.setDefaultGuildConfigRepository(explicitDefault as never);
    expect(module.getGuildConfigRepository()).toBe(explicitDefault);
  });

  it("clears cached and default repositories on reset", async () => {
    const repoFromPrisma = { id: "repoFromPrisma" };
    const prisma = { id: "prisma" };
    const createGuildConfigRepositoryMock = vi.fn(() => repoFromPrisma);

    vi.doMock("@/shared/database/repositories/guildConfigRepository", () => ({
      createGuildConfigRepository: createGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/database/guildConfigRepositoryProvider");

    module.getGuildConfigRepository(prisma as never);
    module.resetGuildConfigRepositoryCache();

    expect(() => module.getGuildConfigRepository()).toThrow(
      "GuildConfigRepository is not initialized",
    );
  });

  it("exports provider/repository/types modules", async () => {
    const providerModule = await import(
      "@/shared/database/guildConfigRepositoryProvider"
    );
    const repositoryModule = await import(
      "@/shared/database/repositories/guildConfigRepository"
    );
    const typesModule = await import("@/shared/database/types");

    expect(providerModule.getGuildConfigRepository).toEqual(expect.any(Function));
    expect(providerModule.setDefaultGuildConfigRepository).toEqual(
      expect.any(Function),
    );
    expect(providerModule.resetGuildConfigRepositoryCache).toEqual(
      expect.any(Function),
    );
    expect(repositoryModule.createGuildConfigRepository).toEqual(
      expect.any(Function),
    );
    expect(typesModule.BUMP_REMINDER_MENTION_CLEAR_RESULT).toBeDefined();
    expect(typesModule.BUMP_REMINDER_MENTION_ROLE_RESULT).toBeDefined();
    expect(typesModule.BUMP_REMINDER_MENTION_USER_ADD_RESULT).toBeDefined();
    expect(typesModule.BUMP_REMINDER_MENTION_USER_REMOVE_RESULT).toBeDefined();
    expect(typesModule.BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT).toBeDefined();
  });
});
