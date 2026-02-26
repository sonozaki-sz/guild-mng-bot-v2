// tests/unit/shared/database/stores/usecases/setBumpReminderEnabled.test.ts
import {
  casUpdateBumpReminderConfig,
  createInitialBumpReminderConfig,
  fetchBumpReminderConfigSnapshot,
  initializeBumpReminderConfigIfMissing,
} from "@/shared/database/stores/helpers/bumpReminderConfigCas";
import { setBumpReminderEnabledUseCase } from "@/shared/database/stores/usecases/setBumpReminderEnabled";
import type { MockedFunction } from "vitest";

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

// CAS（Compare-And-Swap）を用いたバンプリマインダー有効化ユースケースを検証する
// 初回作成・変更なしのスキップ・正規化・リトライ枯渇エラー・競合後の再試行成功の各フローを網羅する
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

  // テスト間でモックの呼び出し履歴が干渉しないようリセットする
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

  // 既存設定と新値が同一の場合、不要な DB 書き込みが発生しないことを検証
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

  // DB に mentionUserIds が null で保存されていた場合に空配列へ正規化してから CAS 更新されることを検証
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

  // CAS が常に競合失敗を返し続けた場合にリトライ上限到達後 DatabaseError が投げられることを検証
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

  // 初期化が競合で false を返したとき、次のスナップショット取得 → CAS 更新の経路に自然に移行することを検証
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
