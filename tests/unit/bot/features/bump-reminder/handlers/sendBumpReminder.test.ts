// tests/unit/bot/features/bump-reminder/handlers/sendBumpReminder.test.ts
import { BUMP_SERVICES } from "@/bot/features/bump-reminder/constants/bumpReminderConstants";
import { sendBumpReminder } from "@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder";

const getGuildTranslatorMock = vi.fn();
const tDefaultMock = vi.fn(
  (key: string, _options?: Record<string, unknown>) => key,
);

const loggerInfoMock = vi.fn();
const loggerDebugMock = vi.fn();
const loggerWarnMock = vi.fn();

vi.mock("@/shared/locale/helpers", () => ({
  getGuildTranslator: (guildId: string) => getGuildTranslatorMock(guildId),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string, options?: Record<string, unknown>) =>
    tDefaultMock(key, options),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    warn: (...args: unknown[]) => loggerWarnMock(...args),
  },
}));

// sendBumpReminder ユースケースを検証: テキストチャンネル不在・無効化・正常送信の各シナリオをカバーする
describe("bot/features/bump-reminder/handlers/usecases/sendBumpReminder", () => {
  // モックの呼び出し記録をリセットし、翻訳関数がキーをそのまま返すデフォルト動作をセット
  beforeEach(() => {
    vi.clearAllMocks();
    getGuildTranslatorMock.mockResolvedValue((key: string) => key);
  });

  // テキストベースでないチャンネルに対しては送信せず警告ログを出力することを確認
  it("warns and returns when channel is not text-based", async () => {
    const client = {
      channels: {
        fetch: vi.fn().mockResolvedValue({ isTextBased: () => false }),
      },
    };
    const configService = { getBumpReminderConfig: vi.fn() };

    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      BUMP_SERVICES.DISBOARD,
      configService as never,
    );

    expect(loggerWarnMock).toHaveBeenCalled();
  });

  // リマインダー設定で enabled: false の場合はメッセージ送信をスキップすることを確認
  it("returns when reminder is disabled", async () => {
    const send = vi.fn();
    const client = {
      channels: {
        fetch: vi.fn().mockResolvedValue({
          isTextBased: () => true,
          isSendable: () => true,
          send,
        }),
      },
    };
    const configService = {
      getBumpReminderConfig: vi.fn().mockResolvedValue({ enabled: false }),
    };

    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      BUMP_SERVICES.DISBOARD,
      configService as never,
    );

    expect(send).not.toHaveBeenCalled();
    expect(loggerDebugMock).toHaveBeenCalled();
  });

  // panelId が渡された場合、送信後の finally でパネルメッセージを削除し、リプライにメンション文字列が含まれることを確認
  it("sends reply and deletes panel in finally", async () => {
    const panelDelete = vi.fn().mockResolvedValue(undefined);
    const fetchMessage = vi.fn().mockResolvedValue({ delete: panelDelete });
    const channel = {
      isTextBased: () => true,
      isSendable: () => true,
      send: vi.fn().mockResolvedValue(undefined),
      messages: { fetch: fetchMessage },
    };
    const client = {
      channels: {
        fetch: vi.fn().mockResolvedValue(channel),
      },
    };
    const configService = {
      getBumpReminderConfig: vi.fn().mockResolvedValue({
        enabled: true,
        mentionRoleId: "role-1",
        mentionUserIds: ["user-1"],
      }),
    };

    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      BUMP_SERVICES.DISBOARD,
      configService as never,
      "panel-1",
    );

    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("<@&role-1> <@user-1>"),
        reply: { messageReference: "msg-1" },
      }),
    );
    expect(fetchMessage).toHaveBeenCalledWith("panel-1");
    expect(panelDelete).toHaveBeenCalled();
    expect(loggerInfoMock).toHaveBeenCalled();
  });
});
