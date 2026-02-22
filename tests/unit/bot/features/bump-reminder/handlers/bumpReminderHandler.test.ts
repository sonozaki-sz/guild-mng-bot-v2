import {
  handleBumpDetected,
  sendBumpPanel,
  sendBumpReminder,
} from "@/bot/features/bump-reminder/handlers/bumpReminderHandler";

const getBotBumpReminderConfigServiceMock = vi.fn();
const scheduleBumpReminderMock = vi.fn();
const getGuildTranslatorMock = vi.fn();
const tDefaultMock = vi.fn(
  (key: string, _options?: Record<string, unknown>) => key,
);
const createInfoEmbedMock = vi.fn(
  (description: string, opts?: { title?: string }) => ({
    description,
    title: opts?.title,
  }),
);

const loggerMock = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const getReminderDelayMinutesMock = vi.fn(() => 120);
const toScheduledAtMock = vi.fn(
  (_delayMinutes: number) => new Date("2026-02-20T01:00:00.000Z"),
);

vi.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderConfigService: () => getBotBumpReminderConfigServiceMock(),
}));

vi.mock(
  "@/bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder",
  () => ({
    scheduleBumpReminder: (...args: unknown[]) =>
      scheduleBumpReminderMock(...args),
  }),
);

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string, options?: Record<string, unknown>) =>
    tDefaultMock(key, options),
}));

vi.mock("@/shared/locale/helpers", () => ({
  getGuildTranslator: (guildId: string) => getGuildTranslatorMock(guildId),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerMock.info(...args),
    debug: (...args: unknown[]) => loggerMock.debug(...args),
    warn: (...args: unknown[]) => loggerMock.warn(...args),
    error: (...args: unknown[]) => loggerMock.error(...args),
  },
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: (description: string, options?: { title?: string }) =>
    createInfoEmbedMock(description, options),
}));

vi.mock(
  "@/bot/features/bump-reminder/constants/bumpReminderConstants",
  async () => {
    const actual = await vi.importActual(
      "@/bot/features/bump-reminder/constants/bumpReminderConstants",
    );
    return {
      ...(actual as object),
      getReminderDelayMinutes: () => getReminderDelayMinutesMock(),
      toScheduledAt: (delayMinutes: number) => toScheduledAtMock(delayMinutes),
    };
  },
);

// bump-reminder handler の検知・パネル送信・通知送信の主要分岐を検証
describe("bot/features/bump-reminder/bumpReminderHandler", () => {
  // 各ケースのモック履歴を初期化し、前ケースの副作用を遮断する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // sendBumpPanel の送信条件分岐（text/sendable/例外）と payload 生成を検証
  describe("sendBumpPanel", () => {
    it("returns undefined when target channel is not text-based", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => false,
          }),
        },
      };

      const result = await sendBumpPanel(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        120,
      );

      expect(result).toBeUndefined();
    });

    it("returns undefined when channel is not sendable", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => true,
            isSendable: () => false,
          }),
        },
      };

      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      const result = await sendBumpPanel(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        120,
      );

      expect(result).toBeUndefined();
    });

    it("sends panel message with localized embed and returns message id", async () => {
      const sendMock = vi.fn().mockResolvedValue({ id: "panel-1" });
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => true,
            isSendable: () => true,
            send: sendMock,
          }),
        },
      };

      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      const result = await sendBumpPanel(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        120,
      );

      expect(result).toBe("panel-1");
      expect(createInfoEmbedMock).toHaveBeenCalledWith(
        "events:bump-reminder.panel.scheduled_at",
        {
          title: "events:bump-reminder.panel.title",
        },
      );
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          components: expect.any(Array),
          reply: { messageReference: "msg-1" },
        }),
      );
    });

    it("returns undefined and logs when channel fetch throws", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockRejectedValue(new Error("fetch failed")),
        },
      };

      const result = await sendBumpPanel(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        120,
      );

      expect(result).toBeUndefined();
      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_panel_send_failed",
        expect.any(Error),
      );
    });
  });

  // sendBumpReminder の通知文生成・送信分岐・finally削除を検証
  describe("sendBumpReminder", () => {
    it("warns and returns when channel is not text-based", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => false,
          }),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn(),
      };

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        repository as never,
      );

      expect(loggerMock.warn).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_channel_not_found",
      );
    });

    it("returns when reminder config is disabled", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            isTextBased: () => true,
            isSendable: () => true,
            send: vi.fn(),
          }),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({ enabled: false }),
      };

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        repository as never,
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_disabled",
      );
    });

    it("sends reply message with mentions for known service", async () => {
      const sendMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: vi.fn(),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: "role-1",
          mentionUserIds: ["u-1", "u-2"],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        repository as never,
      );

      expect(sendMock).toHaveBeenCalledWith({
        content:
          "<@&role-1> <@u-1> <@u-2>\nevents:bump-reminder.reminder_message.disboard",
        reply: { messageReference: "msg-1" },
      });
    });

    it("sends plain message for unknown service without reply reference", async () => {
      const sendMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: vi.fn(),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        undefined,
        undefined,
        repository as never,
      );

      expect(sendMock).toHaveBeenCalledWith(
        "events:bump-reminder.reminder_message",
      );
    });

    it("uses dissoku reminder message when service is DISSOKU", async () => {
      const sendMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: vi.fn(),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        undefined,
        "Dissoku",
        repository as never,
      );

      expect(sendMock).toHaveBeenCalledWith(
        "events:bump-reminder.reminder_message.dissoku",
      );
    });

    it("deletes panel message in finally when panelMessageId is provided", async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: vi.fn().mockResolvedValue(undefined),
        messages: {
          fetch: vi.fn().mockResolvedValue({
            delete: deleteMock,
          }),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        undefined,
        "Disboard",
        repository as never,
        "panel-1",
      );

      expect(channel.messages.fetch).toHaveBeenCalledWith("panel-1");
      expect(deleteMock).toHaveBeenCalledTimes(1);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_panel_deleted",
      );
    });

    it("logs panel deletion failure in finally", async () => {
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: vi.fn().mockResolvedValue(undefined),
        messages: {
          fetch: vi.fn().mockRejectedValue(new Error("panel fetch failed")),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        undefined,
        "Disboard",
        repository as never,
        "panel-1",
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_panel_delete_failed",
        expect.any(Error),
      );
    });

    it("tries re-fetch in finally when initial channel fetch fails", async () => {
      const client = {
        channels: {
          fetch: vi.fn().mockRejectedValue(new Error("fetch failed")),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn(),
      };

      await expect(
        sendBumpReminder(
          client as never,
          "guild-1",
          "ch-1",
          "msg-1",
          "Disboard",
          repository as never,
          "panel-1",
        ),
      ).rejects.toThrow("fetch failed");

      expect(client.channels.fetch).toHaveBeenCalledTimes(2);
    });

    it("does not send message when channel is not sendable", async () => {
      const sendMock = vi.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => false,
        send: sendMock,
        messages: {
          fetch: vi.fn(),
        },
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await sendBumpReminder(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        repository as never,
      );

      expect(sendMock).not.toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_sent",
      );
    });
  });

  // handleBumpDetected の検知有効性判定・リマインダー登録・失敗時補償を検証
  describe("handleBumpDetected", () => {
    it("returns early when bump reminder is disabled", async () => {
      getBotBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: vi.fn().mockResolvedValue({ enabled: false }),
      });

      await handleBumpDetected(
        { channels: { fetch: vi.fn() } } as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_disabled",
      );
      expect(scheduleBumpReminderMock).not.toHaveBeenCalled();
    });

    it("returns early when channel does not match configured channel", async () => {
      getBotBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: vi.fn().mockResolvedValue({
          enabled: true,
          channelId: "expected-ch",
        }),
      });

      await handleBumpDetected(
        { channels: { fetch: vi.fn() } } as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_unregistered_channel",
      );
      expect(scheduleBumpReminderMock).not.toHaveBeenCalled();
    });

    it("schedules reminder and logs detected message on success", async () => {
      const configService = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({ enabled: true }),
      };
      getBotBumpReminderConfigServiceMock.mockReturnValue(configService);
      scheduleBumpReminderMock.mockResolvedValue(undefined);

      const sendMock = vi.fn().mockResolvedValue({ id: "panel-1" });
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await handleBumpDetected(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(scheduleBumpReminderMock).toHaveBeenCalledWith(
        client,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        configService,
        "panel-1",
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        "system:bump-reminder.detected",
      );
    });

    it("passes undefined panel message id when panel is not sendable", async () => {
      const configService = {
        getBumpReminderConfig: vi.fn().mockResolvedValue({ enabled: true }),
      };
      getBotBumpReminderConfigServiceMock.mockReturnValue(configService);
      scheduleBumpReminderMock.mockResolvedValue(undefined);

      const channel = {
        isTextBased: () => true,
        isSendable: () => false,
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await handleBumpDetected(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(scheduleBumpReminderMock).toHaveBeenCalledWith(
        client,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
        configService,
        undefined,
      );
    });

    it("logs detection failure when scheduling throws", async () => {
      getBotBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: vi.fn().mockResolvedValue({ enabled: true }),
      });
      scheduleBumpReminderMock.mockRejectedValue(new Error("set failed"));

      const sendMock = vi.fn().mockResolvedValue({ id: "panel-1" });
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
      };
      const client = {
        channels: {
          fetch: vi.fn().mockResolvedValue(channel),
        },
      };
      getGuildTranslatorMock.mockResolvedValue((key: string) => key);

      await handleBumpDetected(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:bump-reminder.detection_failed",
        expect.any(Error),
      );
    });
  });
});
