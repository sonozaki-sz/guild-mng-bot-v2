import {
  handleBumpDetected,
  sendBumpPanel,
  sendBumpReminder,
} from "../../../../src/bot/features/bump-reminder/bumpReminderHandler";

const getBumpReminderConfigServiceMock = jest.fn();
const getBumpReminderManagerMock = jest.fn();
const getGuildTranslatorMock = jest.fn();
const tDefaultMock = jest.fn(
  (key: string, _options?: Record<string, unknown>) => key,
);
const createInfoEmbedMock = jest.fn(
  (description: string, opts?: { title?: string }) => ({
    description,
    title: opts?.title,
  }),
);

const loggerMock = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const getReminderDelayMinutesMock = jest.fn(() => 120);
const toScheduledAtMock = jest.fn(
  (_delayMinutes: number) => new Date("2026-02-20T01:00:00.000Z"),
);

jest.mock("../../../../src/shared/features/bump-reminder", () => ({
  getBumpReminderConfigService: () => getBumpReminderConfigServiceMock(),
}));

jest.mock("../../../../src/shared/locale", () => ({
  tDefault: (key: string, options?: Record<string, unknown>) =>
    tDefaultMock(key, options),
}));

jest.mock("../../../../src/shared/locale/helpers", () => ({
  getGuildTranslator: (guildId: string) => getGuildTranslatorMock(guildId),
}));

jest.mock("../../../../src/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerMock.info(...args),
    debug: (...args: unknown[]) => loggerMock.debug(...args),
    warn: (...args: unknown[]) => loggerMock.warn(...args),
    error: (...args: unknown[]) => loggerMock.error(...args),
  },
}));

jest.mock("../../../../src/shared/utils/messageResponse", () => ({
  createInfoEmbed: (description: string, options?: { title?: string }) =>
    createInfoEmbedMock(description, options),
}));

jest.mock("../../../../src/bot/features/bump-reminder", () => {
  const actual = jest.requireActual(
    "../../../../src/bot/features/bump-reminder",
  );
  return {
    ...actual,
    getBumpReminderManager: () => getBumpReminderManagerMock(),
    getReminderDelayMinutes: () => getReminderDelayMinutesMock(),
    toScheduledAt: (delayMinutes: number) => toScheduledAtMock(delayMinutes),
  };
});

// bump-reminder handler の検知・パネル送信・通知送信の主要分岐を検証
describe("bot/features/bump-reminder/bumpReminderHandler", () => {
  // 各ケースのモック履歴を初期化し、前ケースの副作用を遮断する
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // sendBumpPanel の送信条件分岐（text/sendable/例外）と payload 生成を検証
  describe("sendBumpPanel", () => {
    it("returns undefined when target channel is not text-based", async () => {
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue({
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
          fetch: jest.fn().mockResolvedValue({
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
      const sendMock = jest.fn().mockResolvedValue({ id: "panel-1" });
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue({
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
          fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
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
          fetch: jest.fn().mockResolvedValue({
            isTextBased: () => false,
          }),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn(),
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
          fetch: jest.fn().mockResolvedValue({
            isTextBased: () => true,
            isSendable: () => true,
            send: jest.fn(),
          }),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn().mockResolvedValue({ enabled: false }),
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
      const sendMock = jest.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: jest.fn(),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn().mockResolvedValue({
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
      const sendMock = jest.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: jest.fn(),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn().mockResolvedValue({
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
      const sendMock = jest.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: jest.fn(),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn().mockResolvedValue({
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
      const deleteMock = jest.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: jest.fn().mockResolvedValue(undefined),
        messages: {
          fetch: jest.fn().mockResolvedValue({
            delete: deleteMock,
          }),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn().mockResolvedValue({
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
        send: jest.fn().mockResolvedValue(undefined),
        messages: {
          fetch: jest.fn().mockRejectedValue(new Error("panel fetch failed")),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn().mockResolvedValue({
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
          fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn(),
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
      const sendMock = jest.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => false,
        send: sendMock,
        messages: {
          fetch: jest.fn(),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
        },
      };
      const repository = {
        getBumpReminderConfig: jest.fn().mockResolvedValue({
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
      getBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: jest.fn().mockResolvedValue({ enabled: false }),
      });

      await handleBumpDetected(
        { channels: { fetch: jest.fn() } } as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_disabled",
      );
    });

    it("returns early when channel does not match configured channel", async () => {
      getBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: jest.fn().mockResolvedValue({
          enabled: true,
          channelId: "expected-ch",
        }),
      });

      await handleBumpDetected(
        { channels: { fetch: jest.fn() } } as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_unregistered_channel",
      );
    });

    it("sets reminder and logs detected message on success", async () => {
      const setReminder = jest.fn().mockResolvedValue(undefined);
      getBumpReminderManagerMock.mockReturnValue({ setReminder });
      getBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: jest
          .fn()
          .mockResolvedValueOnce({ enabled: true })
          .mockResolvedValueOnce({ enabled: true, mentionUserIds: [] }),
      });

      const sendMock = jest.fn().mockResolvedValue({ id: "panel-1" });
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: jest.fn(),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
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

      expect(setReminder).toHaveBeenCalledWith(
        "guild-1",
        "ch-1",
        "msg-1",
        "panel-1",
        120,
        expect.any(Function),
        "Disboard",
      );
      expect(loggerMock.info).toHaveBeenCalledWith(
        "system:bump-reminder.detected",
      );
    });

    it("executes reminder task closure passed to manager", async () => {
      let capturedTask: (() => Promise<void>) | undefined;
      const setReminder = jest
        .fn()
        .mockImplementation(
          async (
            _guildId: string,
            _channelId: string,
            _messageId: string,
            _panelMessageId: string | undefined,
            _delayMinutes: number,
            task: () => Promise<void>,
          ) => {
            capturedTask = task;
          },
        );
      getBumpReminderManagerMock.mockReturnValue({ setReminder });
      getBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: jest.fn().mockResolvedValue({
          enabled: true,
          mentionRoleId: null,
          mentionUserIds: [],
        }),
      });

      const sendMock = jest.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: sendMock,
        messages: {
          fetch: jest.fn(),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
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

      expect(capturedTask).toBeDefined();
      await capturedTask?.();

      expect(sendMock).toHaveBeenCalledWith({
        content: "events:bump-reminder.reminder_message.disboard",
        reply: { messageReference: "msg-1" },
      });
    });

    it("deletes orphaned panel when setReminder fails", async () => {
      const setReminder = jest.fn().mockRejectedValue(new Error("set failed"));
      getBumpReminderManagerMock.mockReturnValue({ setReminder });
      getBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: jest.fn().mockResolvedValue({ enabled: true }),
      });

      const panelDelete = jest.fn().mockResolvedValue(undefined);
      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: jest.fn().mockResolvedValue({ id: "panel-1" }),
        messages: {
          fetch: jest.fn().mockResolvedValue({ delete: panelDelete }),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
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

      expect(panelDelete).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:bump-reminder.detection_failed",
        expect.any(Error),
      );
    });

    it("logs orphaned panel deletion failure when cleanup throws", async () => {
      const setReminder = jest.fn().mockRejectedValue(new Error("set failed"));
      getBumpReminderManagerMock.mockReturnValue({ setReminder });
      getBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: jest.fn().mockResolvedValue({ enabled: true }),
      });

      const channel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: jest.fn().mockResolvedValue({ id: "panel-1" }),
        messages: {
          fetch: jest.fn().mockRejectedValue(new Error("panel fetch failed")),
        },
      };
      const client = {
        channels: {
          fetch: jest.fn().mockResolvedValue(channel),
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

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:scheduler.bump_reminder_orphaned_panel_delete_failed",
        expect.any(Error),
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:bump-reminder.detection_failed",
        expect.any(Error),
      );
    });

    it("skips orphan cleanup delete when fetched channel is not text-based", async () => {
      const setReminder = jest.fn().mockRejectedValue(new Error("set failed"));
      getBumpReminderManagerMock.mockReturnValue({ setReminder });
      getBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: jest.fn().mockResolvedValue({ enabled: true }),
      });

      const panelChannel = {
        isTextBased: () => true,
        isSendable: () => true,
        send: jest.fn().mockResolvedValue({ id: "panel-1" }),
        messages: {
          fetch: jest.fn(),
        },
      };
      const nonTextChannel = {
        isTextBased: () => false,
      };
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(panelChannel)
        .mockResolvedValueOnce(nonTextChannel);
      const client = {
        channels: {
          fetch: fetchMock,
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

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:bump-reminder.detection_failed",
        expect.any(Error),
      );
    });

    it("skips orphan cleanup block when panel message id is undefined", async () => {
      const setReminder = jest.fn().mockRejectedValue(new Error("set failed"));
      getBumpReminderManagerMock.mockReturnValue({ setReminder });
      getBumpReminderConfigServiceMock.mockReturnValue({
        getBumpReminderConfig: jest.fn().mockResolvedValue({ enabled: true }),
      });

      const nonTextChannel = {
        isTextBased: () => false,
      };
      const fetchMock = jest.fn().mockResolvedValue(nonTextChannel);
      const client = {
        channels: {
          fetch: fetchMock,
        },
      };

      await handleBumpDetected(
        client as never,
        "guild-1",
        "ch-1",
        "msg-1",
        "Disboard",
      );

      expect(setReminder).toHaveBeenCalledWith(
        "guild-1",
        "ch-1",
        "msg-1",
        undefined,
        120,
        expect.any(Function),
        "Disboard",
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:bump-reminder.detection_failed",
        expect.any(Error),
      );
    });
  });
});
