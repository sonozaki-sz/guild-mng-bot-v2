import { restoreBumpRemindersOnStartup } from "@/bot/features/bump-reminder/handlers/bumpReminderStartup";

const getBotBumpReminderConfigServiceMock = vi.fn();
const getBotBumpReminderManagerMock = vi.fn();
const restorePendingRemindersMock = vi.fn();
const loggerErrorMock = vi.fn();
const sendBumpReminderMock = vi.fn();

vi.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderConfigService: (...args: unknown[]) =>
    getBotBumpReminderConfigServiceMock(...args),
  getBotBumpReminderManager: (...args: unknown[]) =>
    getBotBumpReminderManagerMock(...args),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

vi.mock("@/bot/features/bump-reminder/handlers/bumpReminderHandler", () => ({
  sendBumpReminder: (...args: unknown[]) => sendBumpReminderMock(...args),
}));

describe("bot/features/bump-reminder/handlers/bumpReminderStartup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBotBumpReminderConfigServiceMock.mockReturnValue({
      getBumpReminderConfig: vi.fn(),
    });
    getBotBumpReminderManagerMock.mockReturnValue({
      restorePendingReminders: (...args: unknown[]) =>
        restorePendingRemindersMock(...args),
    });
  });

  it("creates task factory and delegates restore", async () => {
    const client = { id: "client" };

    await restoreBumpRemindersOnStartup(client as never);

    expect(restorePendingRemindersMock).toHaveBeenCalledTimes(1);
    const [taskFactory] = restorePendingRemindersMock.mock.calls[0] as [
      (
        guildId: string,
        channelId: string,
        messageId?: string,
        panelMessageId?: string,
        serviceName?: "disboard" | "dissoku",
      ) => () => Promise<void>,
    ];
    const task = taskFactory(
      "guild-1",
      "channel-1",
      "msg-1",
      "panel-1",
      "disboard",
    );
    expect(typeof task).toBe("function");

    await task();
    expect(sendBumpReminderMock).toHaveBeenCalledWith(
      client,
      "guild-1",
      "channel-1",
      "msg-1",
      "disboard",
      expect.any(Object),
      "panel-1",
    );
  });

  it("logs and swallows restore error", async () => {
    restorePendingRemindersMock.mockRejectedValueOnce(
      new Error("restore failed"),
    );

    const client = { id: "client" };
    await expect(
      restoreBumpRemindersOnStartup(client as never),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
