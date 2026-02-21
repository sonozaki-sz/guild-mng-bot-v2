import { BUMP_REMINDER_STATUS } from "@/bot/features/bump-reminder/constants/bumpReminderConstants";
import { cancelBumpReminderUsecase } from "@/bot/features/bump-reminder/services/usecases/cancelBumpReminderUsecase";

const cancelScheduledReminderMock = jest.fn();
const loggerInfoMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.mock(
  "@/bot/features/bump-reminder/services/helpers/bumpReminderScheduleHelper",
  () => ({
    cancelScheduledReminder: (...args: unknown[]) =>
      cancelScheduledReminderMock(...args),
  }),
);

jest.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

jest.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

describe("bot/features/bump-reminder/services/usecases/cancelBumpReminderUsecase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false when no scheduled reminder exists", async () => {
    cancelScheduledReminderMock.mockReturnValue(undefined);
    const repository = { updateStatus: jest.fn() };

    const result = await cancelBumpReminderUsecase({
      repository: repository as never,
      reminders: new Map(),
      guildId: "g1",
    });

    expect(result).toBe(false);
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it("updates status to cancelled when reminder exists", async () => {
    cancelScheduledReminderMock.mockReturnValue({
      jobId: "job-1",
      reminderId: "r1",
    });
    const repository = { updateStatus: jest.fn().mockResolvedValue(undefined) };

    const result = await cancelBumpReminderUsecase({
      repository: repository as never,
      reminders: new Map(),
      guildId: "g1",
    });

    expect(result).toBe(true);
    expect(repository.updateStatus).toHaveBeenCalledWith(
      "r1",
      BUMP_REMINDER_STATUS.CANCELLED,
    );
    expect(loggerInfoMock).toHaveBeenCalled();
  });
});
