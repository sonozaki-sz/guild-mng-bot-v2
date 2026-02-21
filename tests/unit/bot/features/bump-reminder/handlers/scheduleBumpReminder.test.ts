import { scheduleBumpReminder } from "@/bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder";

const SERVICE_NAME = "Disboard" as const;

const getReminderDelayMinutesMock = jest.fn();
const getBotBumpReminderManagerMock = jest.fn();
const setReminderMock = jest.fn();
const sendBumpReminderMock = jest.fn();
const loggerDebugMock = jest.fn();

jest.mock("@/bot/features/bump-reminder/constants/bumpReminderConstants", () => ({
  getReminderDelayMinutes: (...args: unknown[]) =>
    getReminderDelayMinutesMock(...args),
}));

jest.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderManager: (...args: unknown[]) =>
    getBotBumpReminderManagerMock(...args),
}));

jest.mock(
  "@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder",
  () => ({
    sendBumpReminder: (...args: unknown[]) => sendBumpReminderMock(...args),
  }),
);

jest.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

jest.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: (...args: unknown[]) => loggerDebugMock(...args),
  },
}));

describe("bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getReminderDelayMinutesMock.mockReturnValue(120);
    getBotBumpReminderManagerMock.mockReturnValue({
      setReminder: (...args: unknown[]) => setReminderMock(...args),
    });
  });

  it("registers reminder with delay and service", async () => {
    const client = { channels: { fetch: jest.fn() } };
    const configService = { getBumpReminderConfig: jest.fn() };

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

  it("deletes orphan panel and rethrows on registration error", async () => {
    const panelDelete = jest.fn().mockResolvedValue(undefined);
    const fetchMessage = jest.fn().mockResolvedValue({ delete: panelDelete });
    const fetchChannel = jest.fn().mockResolvedValue({
      isTextBased: () => true,
      messages: { fetch: fetchMessage },
    });

    const client = { channels: { fetch: fetchChannel } };
    const configService = { getBumpReminderConfig: jest.fn() };

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
    const client = { channels: { fetch: jest.fn() } };
    const configService = { getBumpReminderConfig: jest.fn() };

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

  it("logs debug when orphan panel deletion fails", async () => {
    const fetchMessage = jest.fn().mockRejectedValue(new Error("fetch failed"));
    const fetchChannel = jest.fn().mockResolvedValue({
      isTextBased: () => true,
      messages: { fetch: fetchMessage },
    });

    const client = { channels: { fetch: fetchChannel } };
    const configService = { getBumpReminderConfig: jest.fn() };
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

  it("rethrows without orphan cleanup when panelMessageId is undefined", async () => {
    const fetchChannel = jest.fn();
    const client = { channels: { fetch: fetchChannel } };
    const configService = { getBumpReminderConfig: jest.fn() };
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

  it("skips panel deletion when fetched channel is not text based", async () => {
    const fetchChannel = jest.fn().mockResolvedValue({
      isTextBased: () => false,
      messages: { fetch: jest.fn() },
    });
    const client = { channels: { fetch: fetchChannel } };
    const configService = { getBumpReminderConfig: jest.fn() };
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
