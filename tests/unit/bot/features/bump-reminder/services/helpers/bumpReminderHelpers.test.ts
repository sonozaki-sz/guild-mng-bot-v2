// tests/unit/bot/features/bump-reminder/services/helpers/bumpReminderHelpers.test.ts
import { BUMP_REMINDER_STATUS } from "@/bot/features/bump-reminder/constants/bumpReminderConstants";
import type { BumpReminder } from "@/bot/features/bump-reminder/repositories/types";
import {
  createBumpReminderRestorePlan,
  type BumpReminderRestorePlan,
} from "@/bot/features/bump-reminder/services/helpers/bumpReminderRestorePlanner";
import {
  cancelScheduledReminder,
  scheduleReminderInMemory,
  type ScheduledReminderRef,
} from "@/bot/features/bump-reminder/services/helpers/bumpReminderScheduleHelper";
import { createTrackedReminderTask } from "@/bot/features/bump-reminder/services/helpers/bumpReminderTrackedTask";
import { logger } from "@/shared/utils/logger";

const addOneTimeJobMock = vi.fn();
const removeJobMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/shared/scheduler/jobScheduler", () => ({
  jobScheduler: {
    addOneTimeJob: (...args: unknown[]) => addOneTimeJobMock(...args),
    removeJob: (...args: unknown[]) => removeJobMock(...args),
  },
}));

describe("bot/features/bump-reminder/helpers", () => {
  // 各ヘルパーの状態遷移を独立に検証できるようモック履歴を初期化
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // guild ごとの pending 正規化で最新1件を選別できることを検証
  describe("createBumpReminderRestorePlan", () => {
    const buildReminder = (
      id: string,
      guildId: string,
      scheduledAt: string,
    ): BumpReminder => ({
      id,
      guildId,
      channelId: `ch-${guildId}`,
      messageId: null,
      panelMessageId: null,
      serviceName: null,
      scheduledAt: new Date(scheduledAt),
      status: BUMP_REMINDER_STATUS.PENDING,
      createdAt: new Date("2026-02-20T00:00:00.000Z"),
      updatedAt: new Date("2026-02-20T00:00:00.000Z"),
    });

    it("keeps latest pending reminder per guild and collects stale ones", () => {
      const reminders = [
        buildReminder("old-a", "g-a", "2026-02-20T00:10:00.000Z"),
        buildReminder("new-a", "g-a", "2026-02-20T00:20:00.000Z"),
        buildReminder("only-b", "g-b", "2026-02-20T00:15:00.000Z"),
      ];

      const plan: BumpReminderRestorePlan =
        createBumpReminderRestorePlan(reminders);

      expect(plan.latestByGuild.get("g-a")?.id).toBe("new-a");
      expect(plan.latestByGuild.get("g-b")?.id).toBe("only-b");
      expect(plan.staleReminders.map((item) => item.id)).toEqual(["old-a"]);
    });

    it("marks later-processed older reminder as stale", () => {
      const reminders = [
        buildReminder("new-a", "g-a", "2026-02-20T00:20:00.000Z"),
        buildReminder("old-a", "g-a", "2026-02-20T00:10:00.000Z"),
      ];

      const plan = createBumpReminderRestorePlan(reminders);

      expect(plan.latestByGuild.get("g-a")?.id).toBe("new-a");
      expect(plan.staleReminders.map((item) => item.id)).toEqual(["old-a"]);
    });
  });

  // メモリ上スケジュールの登録と解除が整合することを検証
  describe("schedule helper", () => {
    it("schedules one-time task and clears reminder map after task execution", async () => {
      const reminders = new Map<string, ScheduledReminderRef>();
      const task = vi.fn().mockResolvedValue(undefined);

      let capturedTask: (() => Promise<void>) | undefined;
      addOneTimeJobMock.mockImplementationOnce(
        (_jobId: string, _delayMs: number, callback: () => Promise<void>) => {
          capturedTask = callback;
        },
      );

      scheduleReminderInMemory(reminders, "g-1", "job-1", "rem-1", 1000, task);

      expect(reminders.get("g-1")).toEqual({
        jobId: "job-1",
        reminderId: "rem-1",
      });

      await capturedTask?.();

      expect(task).toHaveBeenCalledTimes(1);
      expect(reminders.has("g-1")).toBe(false);
    });

    it("cancels existing reminder from scheduler and memory map", () => {
      const reminders = new Map<string, ScheduledReminderRef>();
      reminders.set("g-1", { jobId: "job-1", reminderId: "rem-1" });

      const removed = cancelScheduledReminder(reminders, "g-1");

      expect(removed).toEqual({ jobId: "job-1", reminderId: "rem-1" });
      expect(removeJobMock).toHaveBeenCalledWith("job-1");
      expect(reminders.has("g-1")).toBe(false);
    });

    it("returns undefined when no scheduled reminder exists", () => {
      const reminders = new Map<string, ScheduledReminderRef>();

      const removed = cancelScheduledReminder(reminders, "missing-guild");

      expect(removed).toBeUndefined();
      expect(removeJobMock).not.toHaveBeenCalled();
    });
  });

  // タスク結果に応じた DB ステータス更新と失敗時補償を検証
  describe("createTrackedReminderTask", () => {
    it("updates status to sent when task succeeds", async () => {
      const repository = {
        updateStatus: vi.fn().mockResolvedValue(undefined),
      };
      const task = vi.fn().mockResolvedValue(undefined);

      const trackedTask = createTrackedReminderTask(
        repository as never,
        "guild-1",
        "rem-1",
        task,
      );

      await trackedTask();

      expect(task).toHaveBeenCalledTimes(1);
      expect(repository.updateStatus).toHaveBeenCalledWith(
        "rem-1",
        BUMP_REMINDER_STATUS.SENT,
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("updates status to cancelled when task fails", async () => {
      const repository = {
        updateStatus: vi.fn().mockResolvedValue(undefined),
      };
      const task = vi.fn().mockRejectedValue(new Error("task failed"));

      const trackedTask = createTrackedReminderTask(
        repository as never,
        "guild-2",
        "rem-2",
        task,
      );

      await trackedTask();

      expect(repository.updateStatus).toHaveBeenCalledWith(
        "rem-2",
        BUMP_REMINDER_STATUS.CANCELLED,
      );
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it("logs twice when both task and status update fail", async () => {
      const repository = {
        updateStatus: vi.fn().mockRejectedValue(new Error("db failed")),
      };
      const task = vi.fn().mockRejectedValue(new Error("task failed"));

      const trackedTask = createTrackedReminderTask(
        repository as never,
        "guild-3",
        "rem-3",
        task,
      );

      await trackedTask();

      expect(repository.updateStatus).toHaveBeenCalledWith(
        "rem-3",
        BUMP_REMINDER_STATUS.CANCELLED,
      );
      expect(logger.error).toHaveBeenCalledTimes(2);
    });
  });
});
