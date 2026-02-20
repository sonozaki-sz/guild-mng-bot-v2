// src/bot/features/bump-reminder/services/bumpReminderService.ts
// Bumpリマインダー用のジョブマネージャー
// REFACTORING_PLAN.md Phase 2 - タイマー処理の重複リマインド対策
// DB永続化対応：Bot再起動時もリマインダーを復元可能

import { tDefault } from "../../../../shared/locale";
import { jobScheduler } from "../../../../shared/scheduler";
import { logger, requirePrismaClient } from "../../../../shared/utils";
import {
  BUMP_REMINDER_STATUS,
  isBumpServiceName,
  toBumpReminderJobId,
  toScheduledAt,
  type BumpServiceName,
} from "../constants";
import { getBumpReminderRepository } from "../repositories";

export type BumpReminderTaskFactory = (
  guildId: string,
  channelId: string,
  messageId?: string,
  panelMessageId?: string,
  serviceName?: BumpServiceName,
) => () => Promise<void>;

// 復元時に pending レコードを実行タスクへ変換するためのファクトリ型

/**
 * Bumpリマインダー用のジョブマネージャー
 */
export class BumpReminderManager {
  private reminders: Map<string, { jobId: string; reminderId: string }> =
    new Map();

  /**
   * リマインダーを設定（DBに保存 + スケジュール登録）
   * @param guildId ギルドID
   * @param channelId 通知先チャンネルID
   * @param messageId 元のBumpメッセージID（返信用、オプション）
   * @param panelMessageId Bumpパネルメッセージ ID（送信後削除用、オプション）
   * @param delayMinutes 遅延時間（分）
   * @param task 実行するタスク
   * @param serviceName サービス名（Disboard, Dissoku）
   * @returns 実行完了を示す Promise
   */
  public async setReminder(
    guildId: string,
    channelId: string,
    messageId: string | undefined,
    panelMessageId: string | undefined,
    delayMinutes: number,
    task: () => Promise<void>,
    serviceName?: BumpServiceName,
  ): Promise<void> {
    // ギルド単位の一意ジョブIDを生成
    const jobId = toBumpReminderJobId(guildId);

    // 既存のリマインダーをキャンセル
    if (this.reminders.has(guildId)) {
      logger.info(
        tDefault("system:scheduler.cancel_bump_reminder", { guildId }),
      );
      await this.cancelReminder(guildId);
    }

    // DB に pending リマインダーを保存
    const scheduledAt = toScheduledAt(delayMinutes);
    const repository = getBumpReminderRepository(requirePrismaClient());
    const reminder = await repository.create(
      guildId,
      channelId,
      scheduledAt,
      messageId,
      panelMessageId,
      serviceName,
    );

    // メモリ上の one-time ジョブとして登録
    const delayMs = scheduledAt.getTime() - Date.now();
    this.scheduleReminderInMemory(
      guildId,
      jobId,
      reminder.id,
      delayMs,
      this.createTrackedTask(guildId, reminder.id, task),
    );

    logger.info(
      tDefault("system:scheduler.bump_reminder_scheduled", {
        guildId,
        minutes: delayMinutes,
      }),
    );
  }

  /**
   * タスク実行後に DB ステータスを更新するラッパーを生成する共通ヘルパー
   * 成功時は "sent"、失敗時は "cancelled" に更新する
   * @param guildId ログ出力に利用するギルドID
   * @param reminderId 更新対象のリマインダーID
   * @param task 実行対象タスク
   * @returns ステータス更新付きの実行関数
   */
  private createTrackedTask(
    guildId: string,
    reminderId: string,
    task: () => Promise<void>,
  ): () => Promise<void> {
    return async () => {
      // 実行時点の repository を取得してステータス更新に利用
      const repository = getBumpReminderRepository(requirePrismaClient());
      try {
        await task();
        // 成功したらDBをsent状態に更新
        await repository.updateStatus(reminderId, BUMP_REMINDER_STATUS.SENT);
      } catch (error) {
        logger.error(
          tDefault("system:scheduler.bump_reminder_task_failed", {
            guildId,
          }),
          error,
        );
        // 失敗した場合も pending のまま放置せず cancelled に更新する
        // （Bot 再起動時に不要な再実行が発生しないようにする）
        try {
          await repository.updateStatus(
            reminderId,
            BUMP_REMINDER_STATUS.CANCELLED,
          );
        } catch (statusError) {
          logger.error(
            tDefault("system:scheduler.bump_reminder_task_failed", {
              guildId,
            }),
            statusError,
          );
        }
        // エラーを再スローしない（スケジューラーで上位に伝播させない）
      }
    };
  }

  /**
   * DBレコードを作成せずにメモリ上だけでスケジュールを登録する（Bot再起動後の復元用）
   * @param guildId ギルドID
   * @param jobId ジョブID
   * @param reminderId DB上のリマインダーID
   * @param delayMs 実行までの遅延時間（ミリ秒）
   * @param task 実行するタスク
   * @returns なし
   */
  private scheduleReminderInMemory(
    guildId: string,
    jobId: string,
    reminderId: string,
    delayMs: number,
    task: () => Promise<void>,
  ): void {
    // スケジューラー実行後は管理マップから除去してリークを防ぐ
    jobScheduler.addOneTimeJob(jobId, delayMs, async () => {
      try {
        await task();
      } finally {
        // 1回限りなので削除
        this.reminders.delete(guildId);
      }
    });

    this.reminders.set(guildId, { jobId, reminderId });
  }

  /**
   * リマインダーをキャンセル
   * @param guildId キャンセル対象のギルドID
   * @returns キャンセルできた場合は true
   */
  public async cancelReminder(guildId: string): Promise<boolean> {
    // 管理マップ上の予約情報を解決
    const reminder = this.reminders.get(guildId);
    if (reminder) {
      // スケジューラーとメモリを先にクリア（DB更新の成否に関わらず一貫した状態を保つ）
      // ※以前はDB更新後にメモリを削除していたが、DB更新失敗時にメモリが不整合になる
      //   (スケジューラーには存在しないジョブをメモリが指し続ける) バグがあったため修正。
      jobScheduler.removeJob(reminder.jobId);
      this.reminders.delete(guildId);

      // DBをcancelled状態に更新（失敗してもスケジューラー・メモリは既にクリア済みのため続行）
      try {
        const repository = getBumpReminderRepository(requirePrismaClient());
        await repository.updateStatus(
          reminder.reminderId,
          BUMP_REMINDER_STATUS.CANCELLED,
        );
      } catch (error) {
        logger.error(
          tDefault("system:scheduler.bump_reminder_task_failed", { guildId }),
          error,
        );
      }

      logger.info(
        tDefault("system:scheduler.bump_reminder_cancelled", { guildId }),
      );
      return true;
    }
    return false;
  }

  /**
   * リマインダーが設定されているか確認
   * @param guildId 確認対象のギルドID
   * @returns 予約が存在する場合は true
   */
  public hasReminder(guildId: string): boolean {
    // メモリ上の管理マップに予約情報があるかを返す
    return this.reminders.has(guildId);
  }

  /**
   * Bot起動時にDBから pending のリマインダーを復元
   * DBレコードはそのまま再利用し、メモリ上のスケジュールのみ再登録する
   * @param taskFactory リマインダー実行時のタスクを生成する関数
   * @returns 復元した件数
   */
  public async restorePendingReminders(
    taskFactory: BumpReminderTaskFactory,
  ): Promise<number> {
    // DB 上の pending レコードを取得
    const repository = getBumpReminderRepository(requirePrismaClient());
    const pendingReminders = await repository.findAllPending();
    let restoredCount = 0;

    // 同一ギルドの複数 pending レコードを最新のもの 1 件に絞り込む
    // （Bot クラッシュ等で複数レコードが残った場合の安全対策）
    // 同一 guild の重複 pending を「最新1件」に正規化
    const latestByGuild = new Map<string, (typeof pendingReminders)[0]>();
    const toCancel: (typeof pendingReminders)[0][] = [];

    for (const reminder of pendingReminders) {
      const existing = latestByGuild.get(reminder.guildId);
      if (!existing || reminder.scheduledAt > existing.scheduledAt) {
        if (existing) toCancel.push(existing);
        latestByGuild.set(reminder.guildId, reminder);
      } else {
        toCancel.push(reminder);
      }
    }

    // 古い重複 pending をキャンセル（失敗しても続行）
    await Promise.allSettled(
      toCancel.map((r) =>
        repository.updateStatus(r.id, BUMP_REMINDER_STATUS.CANCELLED),
      ),
    );
    if (toCancel.length > 0) {
      // 重複件数を明示して、データ不整合の兆候を追跡しやすくする
      logger.info(
        tDefault("system:scheduler.bump_reminder_duplicates_cancelled", {
          count: toCancel.length,
        }),
      );
    }

    // 正規化後のレコードを「即時実行」または「再スケジュール」
    for (const reminder of latestByGuild.values()) {
      const now = new Date();
      const serviceName =
        reminder.serviceName && isBumpServiceName(reminder.serviceName)
          ? reminder.serviceName
          : undefined;
      const task = taskFactory(
        reminder.guildId,
        reminder.channelId,
        reminder.messageId || undefined,
        reminder.panelMessageId || undefined,
        serviceName,
      );

      if (reminder.scheduledAt <= now) {
        // すでに実行時刻が過ぎている場合は即座に実行
        logger.info(
          tDefault("system:scheduler.bump_reminder_executing_immediately", {
            guildId: reminder.guildId,
          }),
        );
        // createTrackedTask は内部でエラーを処理して再スローしないため、常に restoredCount を増加
        await this.createTrackedTask(reminder.guildId, reminder.id, task)();
        restoredCount++;
      } else {
        // まだ先の場合はスケジュール再登録（DBレコードはそのまま再利用）
        const delayMs = reminder.scheduledAt.getTime() - now.getTime();
        const jobId = toBumpReminderJobId(reminder.guildId);

        this.scheduleReminderInMemory(
          reminder.guildId,
          jobId,
          reminder.id,
          delayMs,
          this.createTrackedTask(reminder.guildId, reminder.id, task),
        );
        restoredCount++;
      }
    }

    // 復元対象の最終件数（即時実行 + 再スケジュール）を記録
    logger.info(
      tDefault("system:scheduler.bump_reminders_restored", {
        count: restoredCount,
      }),
    );
    return restoredCount;
  }

  /**
   * すべてのリマインダーをクリア
   * 个々のキャンセル失敗時はエラーを記録して続行する
   * @returns 実行完了を示す Promise
   */
  public async clearAll(): Promise<void> {
    // すべての guild 予約に対してキャンセルを並列実行
    const guildIds = Array.from(this.reminders.keys());
    const results = await Promise.allSettled(
      guildIds.map((guildId) => this.cancelReminder(guildId)),
    );
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logger.error(
          tDefault("system:scheduler.bump_reminder_task_failed", {
            guildId: guildIds[index],
          }),
          result.reason,
        );
      }
    });
  }
}

// シングルトンインスタンス
let bumpReminderManager: BumpReminderManager | null = null;

/**
 * BumpReminderManager のシングルトンインスタンスを取得
 * Prismaクライアントは requirePrismaClient() 経由で遅延取得するため引数不要
 * @returns 共有の BumpReminderManager インスタンス
 */
export function getBumpReminderManager(): BumpReminderManager {
  // 初回呼び出し時のみ生成
  if (!bumpReminderManager) {
    bumpReminderManager = new BumpReminderManager();
  }
  // 共有シングルトンを返す
  return bumpReminderManager;
}
