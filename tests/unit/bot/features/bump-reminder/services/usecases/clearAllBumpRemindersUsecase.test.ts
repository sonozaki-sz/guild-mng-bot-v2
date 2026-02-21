import { clearAllBumpRemindersUsecase } from "@/bot/features/bump-reminder/services/usecases/clearAllBumpRemindersUsecase";

const loggerErrorMock = jest.fn();

jest.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

jest.mock("@/shared/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

describe("bot/features/bump-reminder/services/usecases/clearAllBumpRemindersUsecase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls cancelReminder for all tracked guild ids", async () => {
    const cancelReminder = jest.fn().mockResolvedValue(true);
    const reminders = new Map([
      ["g1", { jobId: "job-1", reminderId: "r1" }],
      ["g2", { jobId: "job-2", reminderId: "r2" }],
    ]);

    await clearAllBumpRemindersUsecase({ reminders, cancelReminder });

    expect(cancelReminder).toHaveBeenCalledWith("g1");
    expect(cancelReminder).toHaveBeenCalledWith("g2");
  });

  it("logs when one cancellation promise is rejected", async () => {
    const cancelReminder = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error("failed"));
    const reminders = new Map([
      ["g1", { jobId: "job-1", reminderId: "r1" }],
      ["g2", { jobId: "job-2", reminderId: "r2" }],
    ]);

    await clearAllBumpRemindersUsecase({ reminders, cancelReminder });

    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
