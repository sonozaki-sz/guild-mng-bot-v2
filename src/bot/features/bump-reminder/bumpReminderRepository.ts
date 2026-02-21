// src/bot/features/bump-reminder/bumpReminderRepository.ts
// Bumpリマインダー用リポジトリ

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../../shared/errors";
import { tDefault } from "../../../shared/locale";
import { logger } from "../../../shared/utils/logger";
import { BUMP_REMINDER_STATUS, type BumpReminderStatus } from "./constants";

/**
 * Bump Reminder型定義
 */
export interface BumpReminder {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string | null; // Prismaはnullを使用
  panelMessageId: string | null; // Bumpパネルメッセージ ID (削除用)
  serviceName: string | null; // サービス名 (Disboard, Dissoku)
  scheduledAt: Date;
  status: BumpReminderStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repositoryインターフェース
 */
export interface IBumpReminderRepository {
  create(
    guildId: string,
    channelId: string,
    scheduledAt: Date,
    messageId?: string,
    panelMessageId?: string,
    serviceName?: string,
  ): Promise<BumpReminder>;
  findById(id: string): Promise<BumpReminder | null>;
  findPendingByGuild(guildId: string): Promise<BumpReminder | null>;
  findAllPending(): Promise<BumpReminder[]>;
  updateStatus(id: string, status: BumpReminderStatus): Promise<void>;
  delete(id: string): Promise<void>;
  cancelByGuild(guildId: string): Promise<void>;
  cancelByGuildAndChannel(guildId: string, channelId: string): Promise<void>;
  cleanupOld(daysOld?: number): Promise<number>;
}

/**
 * Prisma実装
 */
export class BumpReminderRepository implements IBumpReminderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 新しいリマインダーを作成
   * 既存pendingのキャンセルと新規作成をトランザクションで原子的に実行し、競合状態を防ぐ
   * @param guildId 登録対象のギルドID
   * @param channelId 通知先チャンネルID
   * @param scheduledAt 実行予定時刻
   * @param messageId 元メッセージID
   * @param panelMessageId パネルメッセージID
   * @param serviceName サービス名
   * @returns 作成したリマインダー
   */
  async create(
    guildId: string,
    channelId: string,
    scheduledAt: Date,
    messageId?: string,
    panelMessageId?: string,
    serviceName?: string,
  ): Promise<BumpReminder> {
    try {
      const reminder = await this.prisma.$transaction(async (tx) => {
        // 同じギルドの既存pendingリマインダーをキャンセル（重複防止）
        // BumpReminderManager はギルド単位で1件のリマインダーを管理するため、
        // channelId に関わらずすべての pending を取消す
        // 取消→新規作成を同一TXで行い、瞬間的な二重pendingを避ける
        await tx.bumpReminder.updateMany({
          where: { guildId, status: BUMP_REMINDER_STATUS.PENDING },
          data: { status: BUMP_REMINDER_STATUS.CANCELLED },
        });

        return tx.bumpReminder.create({
          data: {
            guildId,
            channelId,
            messageId,
            panelMessageId,
            serviceName,
            scheduledAt,
            status: BUMP_REMINDER_STATUS.PENDING,
          },
        });
      });

      logger.debug(
        tDefault("system:database.bump_reminder_created", {
          id: reminder.id,
          guildId,
        }),
      );

      return reminder as BumpReminder;
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_create_failed", { guildId }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_create_failed", { guildId }),
      );
    }
  }

  /**
   * IDでリマインダーを取得
   * @param id 取得対象リマインダーID
   * @returns 該当リマインダー（未存在時は null）
   */
  async findById(id: string): Promise<BumpReminder | null> {
    try {
      const result = await this.prisma.bumpReminder.findUnique({
        where: { id },
      });
      return result as BumpReminder | null;
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_find_failed", { id }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_find_failed", { id }),
      );
    }
  }

  /**
   * ギルドのpendingリマインダーを取得（1つのみ）
   * @param guildId 取得対象のギルドID
   * @returns pending リマインダー（未存在時は null）
   */
  async findPendingByGuild(guildId: string): Promise<BumpReminder | null> {
    try {
      // 最も近い予定時刻の pending を1件だけ取得
      const result = await this.prisma.bumpReminder.findFirst({
        where: {
          guildId,
          status: BUMP_REMINDER_STATUS.PENDING,
        },
        orderBy: {
          scheduledAt: "asc",
        },
      });
      // manager 復元時は最短時刻1件のみ扱うため findFirst を使う
      return result as BumpReminder | null;
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_find_failed", { guildId }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_find_failed", { guildId }),
      );
    }
  }

  /**
   * すべてのpendingリマインダーを取得
   * @returns pending リマインダー一覧
   */
  async findAllPending(): Promise<BumpReminder[]> {
    try {
      // 起動復元用に pending を予定時刻昇順で取得
      const results = await this.prisma.bumpReminder.findMany({
        where: {
          status: BUMP_REMINDER_STATUS.PENDING,
        },
        orderBy: {
          scheduledAt: "asc",
        },
      });
      // 復元処理側で順次再登録しやすいよう昇順で返す
      return results as BumpReminder[];
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_find_all_failed"),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_find_all_failed"),
      );
    }
  }

  /**
   * ステータスを更新
   * @param id 更新対象リマインダーID
   * @param status 更新後ステータス
   * @returns 実行完了を示す Promise
   */
  async updateStatus(id: string, status: BumpReminderStatus): Promise<void> {
    try {
      // 主キー指定で対象レコードを一意更新
      await this.prisma.bumpReminder.update({
        where: { id },
        data: { status },
      });

      logger.debug(
        tDefault("system:database.bump_reminder_status_updated", {
          id,
          status,
        }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_update_failed", { id }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_update_failed", { id }),
      );
    }
  }

  /**
   * リマインダーを削除
   * @param id 削除対象リマインダーID
   * @returns 実行完了を示す Promise
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.bumpReminder.delete({
        where: { id },
      });
      // 物理削除は履歴保持不要な最終状態でのみ実行される想定

      logger.debug(tDefault("system:database.bump_reminder_deleted", { id }));
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_delete_failed", { id }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_delete_failed", { id }),
      );
    }
  }

  /**
   * ギルドのpendingリマインダーをすべてキャンセル
   * @param guildId キャンセル対象のギルドID
   * @returns 実行完了を示す Promise
   */
  async cancelByGuild(guildId: string): Promise<void> {
    try {
      // ギルド内 pending を一括キャンセルへ遷移
      await this.prisma.bumpReminder.updateMany({
        where: {
          guildId,
          status: BUMP_REMINDER_STATUS.PENDING,
        },
        data: {
          status: BUMP_REMINDER_STATUS.CANCELLED,
        },
      });

      logger.debug(
        tDefault("system:database.bump_reminder_cancelled_by_guild", {
          guildId,
        }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_cancel_failed", { guildId }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_cancel_failed", { guildId }),
      );
    }
  }

  /**
   * 特定チャンネルのpendingリマインダーをキャンセル（重複防止用）
   * @param guildId キャンセル対象のギルドID
   * @param channelId キャンセル対象のチャンネルID
   * @returns 実行完了を示す Promise
   */
  async cancelByGuildAndChannel(
    guildId: string,
    channelId: string,
  ): Promise<void> {
    try {
      // ギルド+チャンネルに一致する pending のみを一括キャンセル
      await this.prisma.bumpReminder.updateMany({
        where: {
          guildId,
          channelId,
          status: BUMP_REMINDER_STATUS.PENDING,
        },
        data: {
          status: BUMP_REMINDER_STATUS.CANCELLED,
        },
      });

      logger.debug(
        tDefault("system:database.bump_reminder_cancelled_by_channel", {
          guildId,
          channelId,
        }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_cancel_failed", {
          guildId,
          channelId,
        }),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_cancel_failed", {
          guildId,
          channelId,
        }),
      );
    }
  }

  /**
   * 古いリマインダーをクリーンアップ
   * @param daysOld 何日前のデータを削除するか（デフォルト: 7日）
   * @returns 削除した件数
   */
  async cleanupOld(daysOld: number = 7): Promise<number> {
    try {
      // しきい値日時を計算（更新日時ベースで判定）
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // 完了/取消済みのみを対象に古い履歴を削除
      const result = await this.prisma.bumpReminder.deleteMany({
        where: {
          status: {
            in: [BUMP_REMINDER_STATUS.SENT, BUMP_REMINDER_STATUS.CANCELLED],
          },
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });
      // PENDING は削除対象外にし、未実行タスクの痕跡を保持する

      logger.info(
        tDefault("system:database.bump_reminder_cleanup_completed", {
          count: result.count,
          days: daysOld,
        }),
      );

      return result.count;
    } catch (error) {
      logger.error(
        tDefault("system:database.bump_reminder_cleanup_failed"),
        error,
      );
      throw new DatabaseError(
        tDefault("system:database.bump_reminder_cleanup_failed"),
      );
    }
  }
}

// シングルトンインスタンス
let bumpReminderRepository: BumpReminderRepository | null = null;
let _cachedPrisma: PrismaClient | undefined;

/**
 * BumpReminderRepository のシングルトンインスタンスを取得
 * Prismaクライアントが変わった場合（テスト時のモック差し替えなど）は自動的に再生成する
 * @param prisma 利用する Prisma クライアント
 * @returns 共有の BumpReminderRepository インスタンス
 */
export function getBumpReminderRepository(
  prisma: PrismaClient,
): BumpReminderRepository {
  // 初回または Prisma 差し替え時に再生成
  if (!bumpReminderRepository || _cachedPrisma !== prisma) {
    bumpReminderRepository = new BumpReminderRepository(prisma);
    _cachedPrisma = prisma;
  }
  // 現在有効なシングルトンを返す
  return bumpReminderRepository;
}
