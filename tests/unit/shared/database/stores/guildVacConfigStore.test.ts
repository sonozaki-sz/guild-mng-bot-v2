import { GuildVacConfigStore } from "@/shared/database/stores/guildVacConfigStore";

describe("shared/database/stores/guildVacConfigStore", () => {
  const defaultLocale = "ja";

  const createPrismaMock = () => ({
    guildConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  });

  it("returns parsed vac config from persisted JSON", async () => {
    const prisma = createPrismaMock();
    const parsed = {
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    };
    prisma.guildConfig.findUnique.mockResolvedValue({
      vacConfig: JSON.stringify(parsed),
    });
    const safeJsonParse = vi.fn().mockReturnValue(parsed);

    const store = new GuildVacConfigStore(
      prisma as never,
      defaultLocale,
      safeJsonParse,
    );

    await expect(store.getVacConfig("guild-1")).resolves.toEqual(parsed);
    expect(prisma.guildConfig.findUnique).toHaveBeenCalledWith({
      where: { guildId: "guild-1" },
      select: { vacConfig: true },
    });
    expect(safeJsonParse).toHaveBeenCalledWith(JSON.stringify(parsed));
  });

  it("returns null when config is missing or parse fails", async () => {
    const prisma = createPrismaMock();
    const safeJsonParse = vi.fn().mockReturnValue(undefined);
    const store = new GuildVacConfigStore(
      prisma as never,
      defaultLocale,
      safeJsonParse,
    );

    prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    await expect(store.getVacConfig("guild-2")).resolves.toBeNull();
    expect(safeJsonParse).toHaveBeenNthCalledWith(1, null);

    prisma.guildConfig.findUnique.mockResolvedValueOnce({
      vacConfig: "invalid",
    });
    await expect(store.getVacConfig("guild-2")).resolves.toBeNull();
    expect(safeJsonParse).toHaveBeenNthCalledWith(2, "invalid");
  });

  it("upserts vac config JSON with default locale on create", async () => {
    const prisma = createPrismaMock();
    const safeJsonParse = vi.fn();
    const store = new GuildVacConfigStore(
      prisma as never,
      defaultLocale,
      safeJsonParse,
    );

    const vacConfig = {
      enabled: true,
      triggerChannelIds: ["trigger-1", "trigger-2"],
      createdChannels: [
        {
          voiceChannelId: "vc-1",
          ownerId: "user-1",
          createdAt: 123,
        },
      ],
    };

    await store.updateVacConfig("guild-3", vacConfig);

    expect(prisma.guildConfig.upsert).toHaveBeenCalledWith({
      where: { guildId: "guild-3" },
      update: {
        vacConfig: JSON.stringify(vacConfig),
      },
      create: {
        guildId: "guild-3",
        locale: "ja",
        vacConfig: JSON.stringify(vacConfig),
      },
    });
  });
});
