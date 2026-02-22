import type { MockedFunction } from "vitest";
import {
  casUpdateBumpReminderConfig,
  fetchBumpReminderConfigSnapshot,
  initializeBumpReminderConfigIfMissing,
} from "@/shared/database/stores/helpers/bumpReminderConfigCas";
import { updateBumpReminderConfigUseCase } from "@/shared/database/stores/usecases/updateBumpReminderConfig";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn(() => "update-config-failed"),
}));

vi.mock("@/shared/database/stores/helpers/bumpReminderConfigCas", () => ({
  BUMP_REMINDER_CAS_MAX_RETRIES: 3,
  fetchBumpReminderConfigSnapshot: vi.fn(),
  initializeBumpReminderConfigIfMissing: vi.fn(),
  casUpdateBumpReminderConfig: vi.fn(),
}));

describe("shared/database/stores/usecases/updateBumpReminderConfig", () => {
  const fetchSnapshotMock =
    fetchBumpReminderConfigSnapshot as MockedFunction<
      typeof fetchBumpReminderConfigSnapshot
    >;
  const initializeIfMissingMock =
    initializeBumpReminderConfigIfMissing as MockedFunction<
      typeof initializeBumpReminderConfigIfMissing
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

  it("returns immediately when persisted JSON already matches", async () => {
    const payload = { enabled: true, mentionUserIds: [] };
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: true,
      rawConfig: JSON.stringify(payload),
    });

    await expect(
      updateBumpReminderConfigUseCase(context, "g1", payload as never),
    ).resolves.toBeUndefined();
    expect(casUpdateMock).not.toHaveBeenCalled();
  });

  it("initializes missing config and returns when initialization succeeds", async () => {
    const payload = { enabled: true, mentionUserIds: [] };
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: false,
      rawConfig: null,
    });
    initializeIfMissingMock.mockResolvedValueOnce(true);

    await expect(
      updateBumpReminderConfigUseCase(context, "g2", payload as never),
    ).resolves.toBeUndefined();
    expect(initializeIfMissingMock).toHaveBeenCalledWith(
      context.prisma,
      "g2",
      "ja",
      payload,
      false,
    );
  });

  it("retries when initialization fails once and succeeds via CAS", async () => {
    const payload = { enabled: true, mentionUserIds: ["u1"] };
    fetchSnapshotMock
      .mockResolvedValueOnce({ recordExists: true, rawConfig: null })
      .mockResolvedValueOnce({
        recordExists: true,
        rawConfig: '{"enabled":false,"mentionUserIds":[]}',
      });
    initializeIfMissingMock.mockResolvedValueOnce(false);
    casUpdateMock.mockResolvedValueOnce(true);

    await expect(
      updateBumpReminderConfigUseCase(context, "g3", payload as never),
    ).resolves.toBeUndefined();
    expect(casUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("throws DatabaseError after CAS conflicts exceed retry limit", async () => {
    const payload = { enabled: true, mentionUserIds: [] };
    fetchSnapshotMock.mockResolvedValue({
      recordExists: true,
      rawConfig: '{"enabled":false,"mentionUserIds":[]}',
    });
    casUpdateMock.mockResolvedValue(false);

    await expect(
      updateBumpReminderConfigUseCase(context, "g4", payload as never),
    ).rejects.toMatchObject({ name: "DatabaseError" });
  });
});
