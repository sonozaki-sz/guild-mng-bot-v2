import {
  existsGuildConfigRecord,
  findAfkConfigJson,
  findGuildConfigRecord,
  findGuildLocale,
  findMemberLogConfigJson,
  findStickMessagesJson,
} from "@/shared/database/repositories/persistence/guildConfigReadPersistence";

describe("shared/database/repositories/persistence/guildConfigReadPersistence", () => {
  const createPrisma = () => ({
    guildConfig: {
      findUnique: vi.fn(),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findGuildConfigRecord returns full record by guildId", async () => {
    const prisma = createPrisma();
    const record = { guildId: "guild-1", locale: "ja" };
    prisma.guildConfig.findUnique.mockResolvedValue(record);

    await expect(
      findGuildConfigRecord(prisma as never, "guild-1"),
    ).resolves.toBe(record);
    expect(prisma.guildConfig.findUnique).toHaveBeenCalledWith({
      where: { guildId: "guild-1" },
    });
  });

  it("existsGuildConfigRecord returns true/false based on selected id", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.findUnique.mockResolvedValueOnce({ id: 1 });
    await expect(
      existsGuildConfigRecord(prisma as never, "guild-1"),
    ).resolves.toBe(true);
    expect(prisma.guildConfig.findUnique).toHaveBeenLastCalledWith({
      where: { guildId: "guild-1" },
      select: { id: true },
    });

    prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    await expect(
      existsGuildConfigRecord(prisma as never, "guild-2"),
    ).resolves.toBe(false);
  });

  it("findGuildLocale returns locale or null", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.findUnique.mockResolvedValueOnce({ locale: "en" });
    await expect(findGuildLocale(prisma as never, "guild-1")).resolves.toBe(
      "en",
    );

    prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    await expect(
      findGuildLocale(prisma as never, "guild-2"),
    ).resolves.toBeNull();
  });

  it("findAfkConfigJson returns json string or null", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.findUnique.mockResolvedValueOnce({ afkConfig: "{}" });
    await expect(findAfkConfigJson(prisma as never, "guild-1")).resolves.toBe(
      "{}",
    );

    prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    await expect(
      findAfkConfigJson(prisma as never, "guild-2"),
    ).resolves.toBeNull();
  });

  it("findStickMessagesJson returns json string or null", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.findUnique.mockResolvedValueOnce({
      stickMessages: "[]",
    });
    await expect(
      findStickMessagesJson(prisma as never, "guild-1"),
    ).resolves.toBe("[]");

    prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    await expect(
      findStickMessagesJson(prisma as never, "guild-2"),
    ).resolves.toBeNull();
  });

  it("findMemberLogConfigJson returns json string or null", async () => {
    const prisma = createPrisma();
    prisma.guildConfig.findUnique.mockResolvedValueOnce({
      memberLogConfig: '{"channelId":"x"}',
    });
    await expect(
      findMemberLogConfigJson(prisma as never, "guild-1"),
    ).resolves.toBe('{"channelId":"x"}');

    prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    await expect(
      findMemberLogConfigJson(prisma as never, "guild-2"),
    ).resolves.toBeNull();
  });
});
