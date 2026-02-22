import {
  casUpdateAfkConfig,
  fetchAfkConfigSnapshot,
  initializeAfkConfigIfMissing,
} from "@/shared/database/stores/helpers/afkConfigCas";

describe("shared/database/stores/helpers/afkConfigCas", () => {
  const createPrisma = () => ({
    guildConfig: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchAfkConfigSnapshot returns record existence and raw JSON", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.findUnique.mockResolvedValueOnce({ afkConfig: "{}" });

    await expect(
      fetchAfkConfigSnapshot(prisma as never, "g1"),
    ).resolves.toEqual({
      recordExists: true,
      rawConfig: "{}",
    });
    expect(prisma.guildConfig.findUnique).toHaveBeenCalledWith({
      where: { guildId: "g1" },
      select: { afkConfig: true },
    });

    prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    await expect(
      fetchAfkConfigSnapshot(prisma as never, "g2"),
    ).resolves.toEqual({
      recordExists: false,
      rawConfig: null,
    });
  });

  it("initializeAfkConfigIfMissing uses updateMany when record exists", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(
      initializeAfkConfigIfMissing(
        prisma as never,
        "g1",
        "ja",
        '{"enabled":true}',
        true,
      ),
    ).resolves.toBe(true);

    expect(prisma.guildConfig.updateMany).toHaveBeenCalledWith({
      where: { guildId: "g1", afkConfig: null },
      data: { afkConfig: '{"enabled":true}' },
    });
  });

  it("initializeAfkConfigIfMissing returns false when updateMany affects no rows", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      initializeAfkConfigIfMissing(prisma as never, "g1", "ja", "{}", true),
    ).resolves.toBe(false);
  });

  it("initializeAfkConfigIfMissing upserts when record does not exist", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.upsert.mockResolvedValueOnce({});

    await expect(
      initializeAfkConfigIfMissing(prisma as never, "g2", "ja", "{}", false),
    ).resolves.toBe(true);

    expect(prisma.guildConfig.upsert).toHaveBeenCalledWith({
      where: { guildId: "g2" },
      update: {},
      create: { guildId: "g2", locale: "ja", afkConfig: "{}" },
    });
  });

  it("casUpdateAfkConfig returns true when update succeeds and false otherwise", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(
      casUpdateAfkConfig(prisma as never, "g3", "old", "new"),
    ).resolves.toBe(true);
    expect(prisma.guildConfig.updateMany).toHaveBeenCalledWith({
      where: { guildId: "g3", afkConfig: "old" },
      data: { afkConfig: "new" },
    });

    prisma.guildConfig.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      casUpdateAfkConfig(prisma as never, "g3", "old", "new"),
    ).resolves.toBe(false);
  });
});
