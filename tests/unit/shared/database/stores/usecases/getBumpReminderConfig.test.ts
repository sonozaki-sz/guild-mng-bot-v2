import { getBumpReminderConfigUseCase } from "@/shared/database/stores/usecases/getBumpReminderConfig";

describe("shared/database/stores/usecases/getBumpReminderConfig", () => {
  const createContext = () => ({
    prisma: {
      guildConfig: {
        findUnique: vi.fn(),
      },
    },
    defaultLocale: "ja",
    safeJsonParse: vi.fn(),
  });

  it("returns parsed config and normalizes mentionUserIds", async () => {
    const context = createContext();
    context.prisma.guildConfig.findUnique.mockResolvedValueOnce({
      bumpReminderConfig: '{"enabled":true,"channelId":"ch1"}',
    });
    context.safeJsonParse.mockReturnValueOnce({
      enabled: true,
      channelId: "ch1",
    });

    await expect(
      getBumpReminderConfigUseCase(context as never, "g1"),
    ).resolves.toEqual({
      enabled: true,
      channelId: "ch1",
      mentionUserIds: [],
    });
  });

  it("returns parsed config as-is when mentionUserIds is already an array", async () => {
    const context = createContext();
    context.prisma.guildConfig.findUnique.mockResolvedValueOnce({
      bumpReminderConfig: '{"enabled":true,"mentionUserIds":["u1"]}',
    });
    context.safeJsonParse.mockReturnValueOnce({
      enabled: true,
      mentionUserIds: ["u1"],
    });

    await expect(
      getBumpReminderConfigUseCase(context as never, "g2"),
    ).resolves.toEqual({
      enabled: true,
      mentionUserIds: ["u1"],
    });
  });

  it("returns null when persisted JSON exists but parse fails", async () => {
    const context = createContext();
    context.prisma.guildConfig.findUnique.mockResolvedValueOnce({
      bumpReminderConfig: "broken",
    });
    context.safeJsonParse.mockReturnValueOnce(undefined);

    await expect(
      getBumpReminderConfigUseCase(context as never, "g3"),
    ).resolves.toBeNull();
  });

  it("returns default config when record is missing", async () => {
    const context = createContext();
    context.prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    context.safeJsonParse.mockReturnValueOnce(undefined);

    await expect(
      getBumpReminderConfigUseCase(context as never, "g4"),
    ).resolves.toEqual({
      enabled: true,
      mentionRoleId: undefined,
      mentionUserIds: [],
    });
  });
});
