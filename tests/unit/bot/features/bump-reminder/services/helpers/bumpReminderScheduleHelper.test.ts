const addOneTimeJobMock = vi.fn();
const removeJobMock = vi.fn();

vi.mock("@/shared/scheduler/jobScheduler", () => ({
  jobScheduler: {
    addOneTimeJob: (...args: unknown[]) => addOneTimeJobMock(...args),
    removeJob: (...args: unknown[]) => removeJobMock(...args),
  },
}));

import {
  cancelScheduledReminder,
  scheduleReminderInMemory,
} from "@/bot/features/bump-reminder/services/helpers/bumpReminderScheduleHelper";

describe("bot/features/bump-reminder/services/helpers/bumpReminderScheduleHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("schedules one-time job and tracks reminder in map", async () => {
    const reminders = new Map<string, { jobId: string; reminderId: string }>();
    const task = vi.fn().mockResolvedValue(undefined);

    let scheduledTask: (() => Promise<void>) | undefined;
    addOneTimeJobMock.mockImplementationOnce(
      (_jobId: string, _delayMs: number, callback: () => Promise<void>) => {
        scheduledTask = callback;
      },
    );

    scheduleReminderInMemory(reminders, "g1", "job-1", "rem-1", 5000, task);
    expect(reminders.get("g1")).toEqual({
      jobId: "job-1",
      reminderId: "rem-1",
    });

    await scheduledTask?.();
    expect(task).toHaveBeenCalledTimes(1);
    expect(reminders.has("g1")).toBe(false);
  });

  it("cancels tracked reminder and removes scheduler job", () => {
    const reminders = new Map<string, { jobId: string; reminderId: string }>();
    reminders.set("g1", { jobId: "job-1", reminderId: "rem-1" });

    const removed = cancelScheduledReminder(reminders, "g1");

    expect(removed).toEqual({ jobId: "job-1", reminderId: "rem-1" });
    expect(removeJobMock).toHaveBeenCalledWith("job-1");
    expect(reminders.has("g1")).toBe(false);
  });
});
