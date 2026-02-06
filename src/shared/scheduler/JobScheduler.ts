// src/shared/scheduler/JobScheduler.ts
// タイマー処理（node-cron）
// REFACTORING_PLAN.md Phase 2 準拠

import cron, { ScheduledTask } from "node-cron";
import { logger } from "../utils/logger";

interface ScheduledJob {
  id: string;
  schedule: string;
  task: () => Promise<void> | void;
  description?: string;
}

/**
 * ジョブスケジューラー
 */
export class JobScheduler {
  private jobs: Map<string, ScheduledTask> = new Map();

  /**
   * ジョブを追加
   */
  public addJob(job: ScheduledJob): void {
    if (this.jobs.has(job.id)) {
      logger.warn(`Job ${job.id} already exists. Removing old job.`);
      this.removeJob(job.id);
    }

    try {
      const scheduledTask = cron.schedule(job.schedule, async () => {
        try {
          logger.debug(`Executing job: ${job.id}`);
          await job.task();
          logger.debug(`Job completed: ${job.id}`);
        } catch (error) {
          logger.error(`Error in job ${job.id}:`, error);
        }
      });

      this.jobs.set(job.id, scheduledTask);
      scheduledTask.start();

      logger.info(
        `Job scheduled: ${job.id}${job.description ? ` - ${job.description}` : ""}`,
      );
    } catch (error) {
      logger.error(`Failed to schedule job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * ジョブを削除
   */
  public removeJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (job) {
      job.stop();
      this.jobs.delete(id);
      logger.info(`Job removed: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * すべてのジョブを停止
   */
  public stopAll(): void {
    logger.info("Stopping all scheduled jobs...");
    for (const [id, job] of this.jobs.entries()) {
      job.stop();
      logger.debug(`Stopped job: ${id}`);
    }
    this.jobs.clear();
  }

  /**
   * ジョブの存在確認
   */
  public hasJob(id: string): boolean {
    return this.jobs.has(id);
  }

  /**
   * すべてのジョブIDを取得
   */
  public getJobIds(): string[] {
    return Array.from(this.jobs.keys());
  }

  /**
   * ジョブ数を取得
   */
  public getJobCount(): number {
    return this.jobs.size;
  }
}

// シングルトンインスタンス
export const jobScheduler = new JobScheduler();

/**
 * Bump通知用のジョブマネージャー
 * REFACTORING_PLAN.md Phase 2 - タイマー処理の重複リマインド対策
 */
export class BumpReminderManager {
  private reminders: Map<string, { jobId: string; lastRemindedAt?: Date }> =
    new Map();

  /**
   * リマインダーを設定
   */
  public setReminder(
    guildId: string,
    delayMinutes: number,
    task: () => Promise<void> | void,
  ): void {
    const jobId = `bump-reminder-${guildId}`;

    // 既存のリマインダーをキャンセル
    if (this.reminders.has(guildId)) {
      logger.info(`Cancelling existing bump reminder for guild ${guildId}`);
      jobScheduler.removeJob(this.reminders.get(guildId)!.jobId);
    }

    // 新しいリマインダーを設定
    const executeAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    const cronExpression = this.dateToCron(executeAt);

    jobScheduler.addJob({
      id: jobId,
      schedule: cronExpression,
      task: async () => {
        try {
          await task();
          this.reminders.set(guildId, {
            jobId,
            lastRemindedAt: new Date(),
          });
        } catch (error) {
          logger.error(
            `Bump reminder task failed for guild ${guildId}:`,
            error,
          );
        } finally {
          // 1回限りなので削除
          jobScheduler.removeJob(jobId);
          this.reminders.delete(guildId);
        }
      },
      description: `Bump reminder for guild ${guildId} at ${executeAt.toISOString()}`,
    });

    this.reminders.set(guildId, { jobId });
    logger.info(
      `Bump reminder scheduled for guild ${guildId} in ${delayMinutes} minutes`,
    );
  }

  /**
   * リマインダーをキャンセル
   */
  public cancelReminder(guildId: string): boolean {
    const reminder = this.reminders.get(guildId);
    if (reminder) {
      jobScheduler.removeJob(reminder.jobId);
      this.reminders.delete(guildId);
      logger.info(`Bump reminder cancelled for guild ${guildId}`);
      return true;
    }
    return false;
  }

  /**
   * 最後のリマインド時刻を取得
   */
  public getLastRemindedAt(guildId: string): Date | undefined {
    return this.reminders.get(guildId)?.lastRemindedAt;
  }

  /**
   * リマインダーが設定されているか確認
   */
  public hasReminder(guildId: string): boolean {
    return this.reminders.has(guildId);
  }

  /**
   * Date を cron形式に変換（1回限りの実行用）
   */
  private dateToCron(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;

    return `${minute} ${hour} ${day} ${month} *`;
  }

  /**
   * すべてのリマインダーをクリア
   */
  public clearAll(): void {
    for (const guildId of this.reminders.keys()) {
      this.cancelReminder(guildId);
    }
  }
}

// シングルトンインスタンス
export const bumpReminderManager = new BumpReminderManager();
