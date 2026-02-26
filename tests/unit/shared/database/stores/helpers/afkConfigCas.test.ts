// tests/unit/shared/database/stores/helpers/afkConfigCas.test.ts
import {
  casUpdateAfkConfig,
  fetchAfkConfigSnapshot,
  initializeAfkConfigIfMissing,
} from "@/shared/database/stores/helpers/afkConfigCas";

// AFK設定の楽観的排他制御（CAS）ヘルパー関数群が
// レコードの有無・updateMany/upsert の分岐・競合検出を正しく処理するかを検証する
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

  // レコードが既存の場合は upsert ではなく updateMany（WHERE afkConfig IS NULL）で初期化する分岐を確認
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

  // 旧値とのマッチングで更新成功なら true、競合（他が先に更新）なら false を返すことを確認
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
