// tests/unit/shared/database/stores/usecases/updateBumpReminderConfig.test.ts
import {
  casUpdateBumpReminderConfig,
  fetchBumpReminderConfigSnapshot,
  initializeBumpReminderConfigIfMissing,
} from "@/shared/database/stores/helpers/bumpReminderConfigCas";
import { updateBumpReminderConfigUseCase } from "@/shared/database/stores/usecases/updateBumpReminderConfig";
import type { MockedFunction } from "vitest";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn(() => "update-config-failed"),
}));

vi.mock("@/shared/database/stores/helpers/bumpReminderConfigCas", () => ({
  BUMP_REMINDER_CAS_MAX_RETRIES: 3,
  fetchBumpReminderConfigSnapshot: vi.fn(),
  initializeBumpReminderConfigIfMissing: vi.fn(),
  casUpdateBumpReminderConfig: vi.fn(),
}));

// updateBumpReminderConfigUseCase の CAS（楽観的排他制御）ロジックと
// 最大リトライ上限・各分岐（レコード未存在・JSON一致・競合）が正しく動作するかを検証する
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

  // 各テストが独立したモック状態から始まることを保証するためにモックをリセットする
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 既存 JSON とペイロードが一致する場合は DB 書き込みをスキップする最適化を確認
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

  // CAS の競合（count=0）がリトライ上限（3回）を超え続けた場合に DatabaseError を投げることを確認
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
