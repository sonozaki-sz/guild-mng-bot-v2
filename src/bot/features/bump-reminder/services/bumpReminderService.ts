// src/bot/features/bump-reminder/services/bumpReminderService.ts
// Bumpリマインダー用のジョブマネージャー
// DB永続化対応：Bot再起動時もリマインダーを復元可能

import { tDefault } from "../../../../shared/locale";
import { logger } from "../../../../shared/utils";
import {
  BUMP_REMINDER_STATUS,
  isBumpServiceName,
  toBumpReminderJobId,
  toScheduledAt,
  type BumpServiceName,
} from "../constants";
import { type IBumpReminderRepository } from "../repositories";
import { createBumpReminderRestorePlan } from "./helpers/bumpReminderRestorePlanner";
import {
  cancelScheduledReminder,
  scheduleReminderInMemory,
  type ScheduledReminderRef,
} from "./helpers/bumpReminderScheduleHelper";

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
  constructor(private readonly repository: IBumpReminderRepository) {}

  private reminders: Map<string, ScheduledReminderRef> = new Map();

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
    const reminder = await this.repository.create(
      guildId,
      channelId,
      scheduledAt,
      messageId,
      panelMessageId,
      serviceName,
    );

    // メモリ上の one-time ジョブとして登録
    const delayMs = scheduledAt.getTime() - Date.now();
    scheduleReminderInMemory(
      this.reminders,
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
      try {
        await task();
        // 成功したらDBをsent状態に更新
        await this.repository.updateStatus(
          reminderId,
          BUMP_REMINDER_STATUS.SENT,
        );
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
          await this.repository.updateStatus(
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
   * リマインダーをキャンセル
   * @param guildId キャンセル対象のギルドID
   * @returns キャンセルできた場合は true
   */
  public async cancelReminder(guildId: string): Promise<boolean> {
    const reminder = cancelScheduledReminder(this.reminders, guildId);
    if (reminder) {
      // DBをcancelled状態に更新（失敗してもスケジューラー・メモリは既にクリア済みのため続行）
      try {
        await this.repository.updateStatus(
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
    const pendingReminders = await this.repository.findAllPending();
    let restoredCount = 0;

    const restorePlan = createBumpReminderRestorePlan(pendingReminders);

    // 古い重複 pending をキャンセル（失敗しても続行）
    await Promise.allSettled(
      restorePlan.staleReminders.map((r) =>
        this.repository.updateStatus(r.id, BUMP_REMINDER_STATUS.CANCELLED),
      ),
    );
    if (restorePlan.staleReminders.length > 0) {
      // 重複件数を明示して、データ不整合の兆候を追跡しやすくする
      logger.info(
        tDefault("system:scheduler.bump_reminder_duplicates_cancelled", {
          count: restorePlan.staleReminders.length,
        }),
      );
    }

    // 正規化後のレコードを「即時実行」または「再スケジュール」
    for (const reminder of restorePlan.latestByGuild.values()) {
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

        scheduleReminderInMemory(
          this.reminders,
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
let cachedRepository: IBumpReminderRepository | undefined;

/**
 * BumpReminderManager インスタンスを生成
 * @param repository 永続化アクセスに利用する repository
 * @returns 新規 BumpReminderManager
 */
export function createBumpReminderManager(
  repository: IBumpReminderRepository,
): BumpReminderManager {
  return new BumpReminderManager(repository);
}

/**
 * BumpReminderManager を解決する
 * repository 未指定時は初期化済みの repository を利用する
 * @returns 共有の BumpReminderManager インスタンス
 */
export function getBumpReminderManager(
  repository?: IBumpReminderRepository,
): BumpReminderManager {
  const resolvedRepository = repository ?? cachedRepository;

  if (!resolvedRepository) {
    throw new Error(
      "BumpReminderManager is not initialized. Initialize in composition root first.",
    );
  }

  // 初回呼び出し時、または注入 repository の変更時のみ再生成
  if (!bumpReminderManager || cachedRepository !== resolvedRepository) {
    bumpReminderManager = createBumpReminderManager(resolvedRepository);
    cachedRepository = resolvedRepository;
  }

  // 共有シングルトンを返す
  return bumpReminderManager;
}
