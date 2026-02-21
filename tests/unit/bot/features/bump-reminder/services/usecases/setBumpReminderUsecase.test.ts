import { setBumpReminderUsecase } from "@/bot/features/bump-reminder/services/usecases/setBumpReminderUsecase";

const toBumpReminderJobIdMock = jest.fn();
const toScheduledAtMock = jest.fn();
const scheduleReminderInMemoryMock = jest.fn();
const createTrackedReminderTaskMock = jest.fn();
const loggerInfoMock = jest.fn();

jest.mock(
  "@/bot/features/bump-reminder/constants/bumpReminderConstants",
  () => ({
    toBumpReminderJobId: (...args: unknown[]) =>
      toBumpReminderJobIdMock(...args),
    toScheduledAt: (...args: unknown[]) => toScheduledAtMock(...args),
  }),
);

jest.mock(
  "@/bot/features/bump-reminder/services/helpers/bumpReminderScheduleHelper",
  () => ({
    scheduleReminderInMemory: (...args: unknown[]) =>
      scheduleReminderInMemoryMock(...args),
  }),
);

jest.mock(
  "@/bot/features/bump-reminder/services/helpers/bumpReminderTrackedTask",
  () => ({
    createTrackedReminderTask: (...args: unknown[]) =>
      createTrackedReminderTaskMock(...args),
  }),
);

jest.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

jest.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

describe("bot/features/bump-reminder/services/usecases/setBumpReminderUsecase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    toBumpReminderJobIdMock.mockReturnValue("job-g1");
    toScheduledAtMock.mockReturnValue(new Date(Date.now() + 60_000));
    createTrackedReminderTaskMock.mockImplementation(
      (
        _repo: unknown,
        _guildId: string,
        _reminderId: string,
        task: () => Promise<void>,
      ) => task,
    );
  });

  it("creates and schedules reminder", async () => {
    const repository = {
      create: jest.fn().mockResolvedValue({ id: "r1" }),
    };
    const reminders = new Map<string, { jobId: string; reminderId: string }>();
    const cancelReminder = jest.fn().mockResolvedValue(true);
    const task = jest.fn().mockResolvedValue(undefined);

    await setBumpReminderUsecase({
      repository: repository as never,
      reminders,
      guildId: "g1",
      channelId: "c1",
      messageId: "m1",
      panelMessageId: "p1",
      delayMinutes: 1,
      task,
      serviceName: "Disboard" as never,
      cancelReminder,
    });

    expect(repository.create).toHaveBeenCalled();
    expect(scheduleReminderInMemoryMock).toHaveBeenCalled();
    expect(cancelReminder).not.toHaveBeenCalled();
    expect(loggerInfoMock).toHaveBeenCalled();
  });

  it("cancels existing reminder before scheduling replacement", async () => {
    const repository = {
      create: jest.fn().mockResolvedValue({ id: "r1" }),
    };
    const reminders = new Map<string, { jobId: string; reminderId: string }>([
      ["g1", { jobId: "job-old", reminderId: "r-old" }],
    ]);
    const cancelReminder = jest.fn().mockResolvedValue(true);

    await setBumpReminderUsecase({
      repository: repository as never,
      reminders,
      guildId: "g1",
      channelId: "c1",
      messageId: undefined,
      panelMessageId: undefined,
      delayMinutes: 1,
      task: jest.fn().mockResolvedValue(undefined),
      serviceName: undefined,
      cancelReminder,
    });

    expect(cancelReminder).toHaveBeenCalledWith("g1");
    expect(scheduleReminderInMemoryMock).toHaveBeenCalled();
  });
});
