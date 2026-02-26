// tests/unit/bot/features/bump-reminder/handlers/scheduleBumpReminder.test.ts
import { scheduleBumpReminder } from "@/bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder";

const SERVICE_NAME = "Disboard" as const;

const getReminderDelayMinutesMock = vi.fn();
const getBotBumpReminderManagerMock = vi.fn();
const setReminderMock = vi.fn();
const sendBumpReminderMock = vi.fn();
const loggerDebugMock = vi.fn();

vi.mock("@/bot/features/bump-reminder/constants/bumpReminderConstants", () => ({
  getReminderDelayMinutes: (...args: unknown[]) =>
    getReminderDelayMinutesMock(...args),
}));

vi.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderManager: (...args: unknown[]) =>
    getBotBumpReminderManagerMock(...args),
}));

vi.mock(
  "@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder",
  () => ({
    sendBumpReminder: (...args: unknown[]) => sendBumpReminderMock(...args),
  }),
);

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: (...args: unknown[]) => loggerDebugMock(...args),
  },
}));

// バンプリマインダーのスケジュール登録ユースケース全体を検証するグループ:
// 正常登録・登録失敗時の孤立パネルクリーンアップ・登録済みタスクの実行内容を確認する
describe("bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder", () => {
  // 各テスト前にモックをリセットし、リマインダー遅延120分とマネージャーの標準動作を設定する
  beforeEach(() => {
    vi.clearAllMocks();
    getReminderDelayMinutesMock.mockReturnValue(120);
    getBotBumpReminderManagerMock.mockReturnValue({
      setReminder: (...args: unknown[]) => setReminderMock(...args),
    });
  });

  it("registers reminder with delay and service", async () => {
    const client = { channels: { fetch: vi.fn() } };
    const configService = { getBumpReminderConfig: vi.fn() };

    await scheduleBumpReminder(
      client as never,
      "guild-1",
      "channel-1",
      "msg-1",
      SERVICE_NAME,
      configService as never,
      "panel-1",
    );

    expect(setReminderMock).toHaveBeenCalledTimes(1);
    expect(setReminderMock.mock.calls[0][0]).toBe("guild-1");
    expect(setReminderMock.mock.calls[0][4]).toBe(120);
    expect(setReminderMock.mock.calls[0][6]).toBe("Disboard");
  });

  // リマインダー登録失敗時に孤立パネルメッセージをチャンネルから削除したうえでエラーを再スローする正常系クリーンアップを検証
  it("deletes orphan panel and rethrows on registration error", async () => {
    const panelDelete = vi.fn().mockResolvedValue(undefined);
    const fetchMessage = vi.fn().mockResolvedValue({ delete: panelDelete });
    const fetchChannel = vi.fn().mockResolvedValue({
      isTextBased: () => true,
      messages: { fetch: fetchMessage },
    });

    const client = { channels: { fetch: fetchChannel } };
    const configService = { getBumpReminderConfig: vi.fn() };

    setReminderMock.mockRejectedValueOnce(new Error("set failed"));

    await expect(
      scheduleBumpReminder(
        client as never,
        "guild-1",
        "channel-1",
        "msg-1",
        SERVICE_NAME,
        configService as never,
        "panel-1",
      ),
    ).rejects.toThrow("set failed");

    expect(fetchChannel).toHaveBeenCalledWith("channel-1");
    expect(fetchMessage).toHaveBeenCalledWith("panel-1");
    expect(panelDelete).toHaveBeenCalled();
  });

  it("executes registered task with sendBumpReminder", async () => {
    const client = { channels: { fetch: vi.fn() } };
    const configService = { getBumpReminderConfig: vi.fn() };

    await scheduleBumpReminder(
      client as never,
      "guild-1",
      "channel-1",
      "msg-1",
      SERVICE_NAME,
      configService as never,
      "panel-1",
    );

    const task = setReminderMock.mock.calls[0][5] as () => Promise<void>;
    await task();

    expect(sendBumpReminderMock).toHaveBeenCalledWith(
      client,
      "guild-1",
      "channel-1",
      "msg-1",
      SERVICE_NAME,
      configService,
      "panel-1",
    );
  });

  // パネル削除自体も失敗した場合、クリーンアップエラーを握りつぶしてデバッグログに記録し元エラーを再スローすることを確認
  it("logs debug when orphan panel deletion fails", async () => {
    const fetchMessage = vi.fn().mockRejectedValue(new Error("fetch failed"));
    const fetchChannel = vi.fn().mockResolvedValue({
      isTextBased: () => true,
      messages: { fetch: fetchMessage },
    });

    const client = { channels: { fetch: fetchChannel } };
    const configService = { getBumpReminderConfig: vi.fn() };
    setReminderMock.mockRejectedValueOnce(new Error("set failed"));

    await expect(
      scheduleBumpReminder(
        client as never,
        "guild-1",
        "channel-1",
        "msg-1",
        SERVICE_NAME,
        configService as never,
        "panel-1",
      ),
    ).rejects.toThrow("set failed");

    expect(loggerDebugMock).toHaveBeenCalledWith(
      "system:scheduler.bump_reminder_orphaned_panel_delete_failed",
      expect.any(Error),
    );
  });

  // panelMessageId が未定義の場合はチャンネルフェッチを行わず元エラーをそのまま再スローする(不要なIO回避)
  it("rethrows without orphan cleanup when panelMessageId is undefined", async () => {
    const fetchChannel = vi.fn();
    const client = { channels: { fetch: fetchChannel } };
    const configService = { getBumpReminderConfig: vi.fn() };
    setReminderMock.mockRejectedValueOnce(new Error("set failed"));

    await expect(
      scheduleBumpReminder(
        client as never,
        "guild-1",
        "channel-1",
        "msg-1",
        SERVICE_NAME,
        configService as never,
        undefined,
      ),
    ).rejects.toThrow("set failed");

    expect(fetchChannel).not.toHaveBeenCalled();
  });

  // 取得したチャンネルがテキストチャンネルでない場合はメッセージ削除をスキップし元エラーだけを再スローすることを確認
  it("skips panel deletion when fetched channel is not text based", async () => {
    const fetchChannel = vi.fn().mockResolvedValue({
      isTextBased: () => false,
      messages: { fetch: vi.fn() },
    });
    const client = { channels: { fetch: fetchChannel } };
    const configService = { getBumpReminderConfig: vi.fn() };
    setReminderMock.mockRejectedValueOnce(new Error("set failed"));

    await expect(
      scheduleBumpReminder(
        client as never,
        "guild-1",
        "channel-1",
        "msg-1",
        SERVICE_NAME,
        configService as never,
        "panel-1",
      ),
    ).rejects.toThrow("set failed");

    expect(fetchChannel).toHaveBeenCalledWith("channel-1");
  });
});
