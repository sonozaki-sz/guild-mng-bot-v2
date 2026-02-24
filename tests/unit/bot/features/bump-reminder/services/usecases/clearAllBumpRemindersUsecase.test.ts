import { clearAllBumpRemindersUsecase } from "@/bot/features/bump-reminder/services/usecases/clearAllBumpRemindersUsecase";

const loggerErrorMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

describe("bot/features/bump-reminder/services/usecases/clearAllBumpRemindersUsecase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls cancelByKey for all tracked reminder keys", async () => {
    const cancelByKey = vi.fn().mockResolvedValue(true);
    const reminders = new Map([
      ["g1", { jobId: "job-1", reminderId: "r1" }],
      ["g2", { jobId: "job-2", reminderId: "r2" }],
    ]);

    await clearAllBumpRemindersUsecase({ reminders, cancelByKey });

    expect(cancelByKey).toHaveBeenCalledWith("g1");
    expect(cancelByKey).toHaveBeenCalledWith("g2");
  });

  it("logs when one cancellation promise is rejected", async () => {
    const cancelByKey = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error("failed"));
    const reminders = new Map([
      ["g1", { jobId: "job-1", reminderId: "r1" }],
      ["g2", { jobId: "job-2", reminderId: "r2" }],
    ]);

    await clearAllBumpRemindersUsecase({ reminders, cancelByKey });

    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
