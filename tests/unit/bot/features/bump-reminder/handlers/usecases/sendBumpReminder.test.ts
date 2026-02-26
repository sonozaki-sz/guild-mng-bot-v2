// tests/unit/bot/features/bump-reminder/handlers/usecases/sendBumpReminder.test.ts
// チャンネル状態・設定状態・サービス種別(Disboard/Dissoku)・パネルメッセージの有無など
// 多様な条件下でリマインダー送信ユースケースが正しく動作することを検証するテスト群
describe("bot/features/bump-reminder/handlers/usecases/sendBumpReminder", () => {
  const tDefaultMock = vi.fn((key: string) => key);
  const loggerMock = {
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };
  const getGuildTranslatorMock = vi.fn();
  const tGuildMock = vi.fn((key: string) => key);

  // vi.doMock を使う都合上、各テストでモジュールキャッシュをリセットして
  // 新しいモック定義が確実に適用された状態でインポートできるようにする
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getGuildTranslatorMock.mockResolvedValue(tGuildMock);

    vi.doMock("@/shared/utils/logger", () => ({ logger: loggerMock }));
    vi.doMock("@/shared/locale/localeManager", () => ({
      tDefault: tDefaultMock,
    }));
    vi.doMock("@/shared/locale/helpers", () => ({
      getGuildTranslator: getGuildTranslatorMock,
    }));
  });

  function makeChannel({
    isTextBased = true,
    isSendable = true,
    sendResult = undefined as unknown,
    messagesFetch = vi.fn().mockResolvedValue({ delete: vi.fn() }),
  } = {}) {
    return {
      isTextBased: vi.fn(() => isTextBased),
      isSendable: vi.fn(() => isSendable),
      send: vi.fn().mockResolvedValue(sendResult),
      messages: { fetch: messagesFetch },
    };
  }

  function makeClient(channel: ReturnType<typeof makeChannel> | null = null) {
    return {
      channels: {
        fetch: vi.fn().mockResolvedValue(channel),
      },
    };
  }

  function makeConfigService(config: unknown = { enabled: true }) {
    return {
      getBumpReminderConfig: vi.fn().mockResolvedValue(config),
    };
  }

  it("exports sendBumpReminder function", async () => {
    const module =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");

    expect(typeof module.sendBumpReminder).toBe("function");
  });

  it("warns and returns when channel is not text-based", async () => {
    const channel = makeChannel({ isTextBased: false });
    const client = makeClient(channel);
    const service = makeConfigService();

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      undefined,
      service as never,
    );

    expect(loggerMock.warn).toHaveBeenCalled();
    expect(service.getBumpReminderConfig).not.toHaveBeenCalled();
  });

  it("debugs and returns when config is disabled", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({ enabled: false });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      undefined,
      service as never,
    );

    expect(loggerMock.debug).toHaveBeenCalled();
    expect(channel.send).not.toHaveBeenCalled();
  });

  // Disboard は bump 元メッセージへのリプライ形式で通知する必要があるため reply フィールドが含まれているか確認
  it("sends message with reply when messageId is provided (Disboard)", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      "Disboard",
      service as never,
    );

    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({ reply: { messageReference: "msg-1" } }),
    );
    expect(loggerMock.info).toHaveBeenCalled();
  });

  it("sends plain message without reply when no messageId (Dissoku)", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Dissoku",
      service as never,
    );

    expect(channel.send).toHaveBeenCalledWith(expect.any(String));
    expect(loggerMock.info).toHaveBeenCalled();
  });

  it("sends message with generic reminder when serviceName is undefined", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      undefined,
      service as never,
    );

    expect(channel.send).toHaveBeenCalled();
  });

  // ロールメンションと複数ユーザーメンションが Discord の書式(<@&...>, <@...>)で本文に含まれることを確認
  it("includes mention role and user ids in message content", async () => {
    const channel = makeChannel();
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1", "user-2"],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Disboard",
      service as never,
    );

    const sentContent = channel.send.mock.calls[0][0] as string;
    expect(sentContent).toContain("<@&role-1>");
    expect(sentContent).toContain("<@user-1>");
    expect(sentContent).toContain("<@user-2>");
  });

  it("cleans up panelMessageId when channel is already text-based", async () => {
    const panelMsgDeleteMock = vi.fn().mockResolvedValue(undefined);
    const fetchMsgMock = vi
      .fn()
      .mockResolvedValue({ delete: panelMsgDeleteMock });
    const channel = makeChannel({ messagesFetch: fetchMsgMock });
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Disboard",
      service as never,
      "panel-msg-1",
    );

    expect(fetchMsgMock).toHaveBeenCalledWith("panel-msg-1");
    expect(panelMsgDeleteMock).toHaveBeenCalled();
    expect(loggerMock.debug).toHaveBeenCalled();
  });

  // 最初の fetch でテキストベース外チャンネルが返った場合でも、finally 節でパネルメッセージ削除用に
  // 再 fetch が行われる分岐を検証(fetchMock が 2 回呼ばれることで確認)
  it("re-fetches channel for panel cleanup when channel is not text-based in finally", async () => {
    const panelMsgDeleteMock = vi.fn().mockResolvedValue(undefined);
    const textChannelForPanel = makeChannel({
      messagesFetch: vi.fn().mockResolvedValue({ delete: panelMsgDeleteMock }),
    });
    // First fetch returns non-text channel, second returns text channel
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeChannel({ isTextBased: false }))
      .mockResolvedValueOnce(textChannelForPanel);
    const client = { channels: { fetch: fetchMock } };
    const service = makeConfigService({ enabled: false });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      undefined,
      "Disboard",
      service as never,
      "panel-msg-1",
    );

    // Second fetch should be called for panel cleanup
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("logs debug when panel message deletion fails", async () => {
    const fetchMsgMock = vi.fn().mockRejectedValue(new Error("Not found"));
    const channel = makeChannel({ messagesFetch: fetchMsgMock });
    const client = makeClient(channel);
    const service = makeConfigService({
      enabled: true,
      mentionRoleId: null,
      mentionUserIds: [],
    });

    const { sendBumpReminder } =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder");
    await expect(
      sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        undefined,
        "Disboard",
        service as never,
        "panel-msg-1",
      ),
    ).resolves.not.toThrow();

    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Error),
    );
  });
});
