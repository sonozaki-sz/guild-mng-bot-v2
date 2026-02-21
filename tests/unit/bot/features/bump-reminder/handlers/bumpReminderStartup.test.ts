import { restoreBumpRemindersOnStartup } from "@/bot/features/bump-reminder/handlers/bumpReminderStartup";

const getBotBumpReminderConfigServiceMock = jest.fn();
const getBotBumpReminderManagerMock = jest.fn();
const restorePendingRemindersMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderConfigService: (...args: unknown[]) =>
    getBotBumpReminderConfigServiceMock(...args),
  getBotBumpReminderManager: (...args: unknown[]) =>
    getBotBumpReminderManagerMock(...args),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

describe("bot/features/bump-reminder/handlers/bumpReminderStartup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBotBumpReminderConfigServiceMock.mockReturnValue({
      getBumpReminderConfig: jest.fn(),
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
