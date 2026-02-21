import { BUMP_REMINDER_STATUS } from "@/bot/features/bump-reminder/constants/bumpReminderConstants";
import { createTrackedReminderTask } from "@/bot/features/bump-reminder/services/helpers/bumpReminderTrackedTask";

const loggerErrorMock = jest.fn();

jest.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

jest.mock("@/shared/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

describe("bot/features/bump-reminder/services/helpers/bumpReminderTrackedTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks reminder as sent when task succeeds", async () => {
    const repository = { updateStatus: jest.fn().mockResolvedValue(undefined) };
    const task = jest.fn().mockResolvedValue(undefined);

    await createTrackedReminderTask(repository as never, "g1", "r1", task)();

    expect(repository.updateStatus).toHaveBeenCalledWith(
      "r1",
      BUMP_REMINDER_STATUS.SENT,
    );
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it("marks reminder cancelled when task fails", async () => {
    const repository = { updateStatus: jest.fn().mockResolvedValue(undefined) };
    const task = jest.fn().mockRejectedValue(new Error("task failed"));

    await createTrackedReminderTask(repository as never, "g1", "r1", task)();

    expect(repository.updateStatus).toHaveBeenCalledWith(
      "r1",
      BUMP_REMINDER_STATUS.CANCELLED,
    );
    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
