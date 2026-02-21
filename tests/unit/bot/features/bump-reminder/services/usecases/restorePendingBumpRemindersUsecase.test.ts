import { BUMP_REMINDER_STATUS } from "@/bot/features/bump-reminder/constants/bumpReminderConstants";
import { restorePendingBumpRemindersUsecase } from "@/bot/features/bump-reminder/services/usecases/restorePendingBumpRemindersUsecase";

const createBumpReminderRestorePlanMock = jest.fn();
const isBumpServiceNameMock = jest.fn();
const toBumpReminderJobIdMock = jest.fn();
const scheduleReminderInMemoryMock = jest.fn();
const createTrackedReminderTaskMock = jest.fn();
const loggerInfoMock = jest.fn();

jest.mock(
  "@/bot/features/bump-reminder/services/helpers/bumpReminderRestorePlanner",
  () => ({
    createBumpReminderRestorePlan: (...args: unknown[]) =>
      createBumpReminderRestorePlanMock(...args),
  }),
);

jest.mock(
  "@/bot/features/bump-reminder/constants/bumpReminderConstants",
  () => ({
    BUMP_REMINDER_STATUS: {
      PENDING: "pending",
      SENT: "sent",
      CANCELLED: "cancelled",
    },
    isBumpServiceName: (...args: unknown[]) => isBumpServiceNameMock(...args),
    toBumpReminderJobId: (...args: unknown[]) =>
      toBumpReminderJobIdMock(...args),
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

describe("bot/features/bump-reminder/services/usecases/restorePendingBumpRemindersUsecase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isBumpServiceNameMock.mockReturnValue(true);
    toBumpReminderJobIdMock.mockReturnValue("job-g1");
    createTrackedReminderTaskMock.mockImplementation(
      (
        _repo: unknown,
        _guildId: string,
        _reminderId: string,
        task: () => Promise<void>,
      ) => task,
    );
  });

  it("cancels stale reminders and schedules latest future reminder", async () => {
    const stale = { id: "stale-1", guildId: "g1" };
    const latest = {
      id: "latest-1",
      guildId: "g1",
      channelId: "c1",
      messageId: "m1",
      panelMessageId: "p1",
      serviceName: "Disboard",
      scheduledAt: new Date(Date.now() + 60_000),
    };

    createBumpReminderRestorePlanMock.mockReturnValue({
      latestByGuild: new Map([["g1", latest]]),
      staleReminders: [stale],
    });

    const repository = {
      findAllPending: jest.fn().mockResolvedValue([stale, latest]),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    const taskFactory = jest
      .fn()
      .mockReturnValue(jest.fn().mockResolvedValue(undefined));

    const count = await restorePendingBumpRemindersUsecase({
      repository: repository as never,
      reminders: new Map(),
      taskFactory,
    });

    expect(count).toBe(1);
    expect(repository.updateStatus).toHaveBeenCalledWith(
      "stale-1",
      BUMP_REMINDER_STATUS.CANCELLED,
    );
    expect(scheduleReminderInMemoryMock).toHaveBeenCalled();
    expect(taskFactory).toHaveBeenCalledWith(
      "g1",
      "c1",
      "m1",
      "p1",
      "Disboard",
    );
  });

  it("executes immediately when reminder is already due", async () => {
    const latest = {
      id: "latest-1",
      guildId: "g1",
      channelId: "c1",
      messageId: null,
      panelMessageId: null,
      serviceName: "Disboard",
      scheduledAt: new Date(Date.now() - 1000),
    };

    createBumpReminderRestorePlanMock.mockReturnValue({
      latestByGuild: new Map([["g1", latest]]),
      staleReminders: [],
    });

    const repository = {
      findAllPending: jest.fn().mockResolvedValue([latest]),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    const immediateTask = jest.fn().mockResolvedValue(undefined);
    const taskFactory = jest.fn().mockReturnValue(immediateTask);

    const count = await restorePendingBumpRemindersUsecase({
      repository: repository as never,
      reminders: new Map(),
      taskFactory,
    });

    expect(count).toBe(1);
    expect(immediateTask).toHaveBeenCalledTimes(1);
    expect(scheduleReminderInMemoryMock).not.toHaveBeenCalled();
  });
});
