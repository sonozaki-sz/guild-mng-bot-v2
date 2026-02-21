import type { MockedFunction } from "vitest";
import {
  casUpdateBumpReminderConfig,
  createInitialBumpReminderConfig,
  fetchBumpReminderConfigSnapshot,
  initializeBumpReminderConfigIfMissing,
} from "@/shared/database/stores/helpers/bumpReminderConfigCas";
import { setBumpReminderEnabledUseCase } from "@/shared/database/stores/usecases/setBumpReminderEnabled";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn(() => "update-config-failed"),
}));

vi.mock("@/shared/database/stores/helpers/bumpReminderConfigCas", () => ({
  BUMP_REMINDER_CAS_MAX_RETRIES: 3,
  fetchBumpReminderConfigSnapshot: vi.fn(),
  initializeBumpReminderConfigIfMissing: vi.fn(),
  createInitialBumpReminderConfig: vi.fn(
    (enabled: boolean, channelId?: string) => ({
      enabled,
      channelId,
      mentionUserIds: [],
    }),
  ),
  casUpdateBumpReminderConfig: vi.fn(),
}));

describe("shared/database/stores/usecases/setBumpReminderEnabled", () => {
  const fetchSnapshotMock =
    fetchBumpReminderConfigSnapshot as MockedFunction<
      typeof fetchBumpReminderConfigSnapshot
    >;
  const initializeIfMissingMock =
    initializeBumpReminderConfigIfMissing as MockedFunction<
      typeof initializeBumpReminderConfigIfMissing
    >;
  const createInitialMock =
    createInitialBumpReminderConfig as MockedFunction<
      typeof createInitialBumpReminderConfig
    >;
  const casUpdateMock = casUpdateBumpReminderConfig as MockedFunction<
    typeof casUpdateBumpReminderConfig
  >;

  const context = {
    prisma: { guildConfig: {} } as never,
    defaultLocale: "ja",
    safeJsonParse: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes when config is missing and initialization succeeds", async () => {
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: false,
      rawConfig: null,
    });
    context.safeJsonParse.mockReturnValueOnce(undefined);
    initializeIfMissingMock.mockResolvedValueOnce(true);

    await expect(
      setBumpReminderEnabledUseCase(context, "g1", true, "ch1"),
    ).resolves.toBeUndefined();

    expect(createInitialMock).toHaveBeenCalledWith(true, "ch1");
    expect(initializeIfMissingMock).toHaveBeenCalled();
  });

  it("returns early when computed config is unchanged", async () => {
    const raw = '{"enabled":true,"channelId":"ch1","mentionUserIds":[]}';
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: true,
      rawConfig: raw,
    });
    context.safeJsonParse.mockReturnValueOnce({
      enabled: true,
      channelId: "ch1",
      mentionUserIds: [],
    });

    await expect(
      setBumpReminderEnabledUseCase(context, "g2", true, "ch1"),
    ).resolves.toBeUndefined();
    expect(casUpdateMock).not.toHaveBeenCalled();
  });

  it("normalizes mentionUserIds and updates through CAS", async () => {
    const raw = '{"enabled":false,"channelId":"ch1","mentionUserIds":null}';
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: true,
      rawConfig: raw,
    });
    context.safeJsonParse.mockReturnValueOnce({
      enabled: false,
      channelId: "ch1",
    });
    casUpdateMock.mockResolvedValueOnce(true);

    await expect(
      setBumpReminderEnabledUseCase(context, "g3", true),
    ).resolves.toBeUndefined();

    expect(casUpdateMock).toHaveBeenCalledWith(
      context.prisma,
      "g3",
      raw,
      '{"enabled":true,"channelId":"ch1","mentionUserIds":[]}',
    );
  });

  it("throws DatabaseError when retries are exhausted", async () => {
    fetchSnapshotMock.mockResolvedValue({
      recordExists: true,
      rawConfig: '{"enabled":false,"mentionUserIds":[]}',
    });
    context.safeJsonParse.mockReturnValue({
      enabled: false,
      mentionUserIds: [],
    });
    casUpdateMock.mockResolvedValue(false);

    await expect(
      setBumpReminderEnabledUseCase(context, "g4", true),
    ).rejects.toMatchObject({ name: "DatabaseError" });
  });

  it("continues when initialization returns false and succeeds on next snapshot", async () => {
    fetchSnapshotMock
      .mockResolvedValueOnce({ recordExists: false, rawConfig: null })
      .mockResolvedValueOnce({
        recordExists: true,
        rawConfig: '{"enabled":false,"channelId":"ch2","mentionUserIds":[]}',
      });
    context.safeJsonParse.mockReturnValueOnce(undefined).mockReturnValueOnce({
      enabled: false,
      channelId: "ch2",
      mentionUserIds: [],
    });
    initializeIfMissingMock.mockResolvedValueOnce(false);
    casUpdateMock.mockResolvedValueOnce(true);

    await expect(
      setBumpReminderEnabledUseCase(context, "g5", true),
    ).resolves.toBeUndefined();

    expect(initializeIfMissingMock).toHaveBeenCalledTimes(1);
    expect(casUpdateMock).toHaveBeenCalledTimes(1);
  });
});
