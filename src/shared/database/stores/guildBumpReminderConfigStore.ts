// src/shared/database/stores/guildBumpReminderConfigStore.ts
// Bumpリマインダー設定の永続化ストア

import type { PrismaClient } from "@prisma/client";
import {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_MODE,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  type BumpReminderConfig,
  type BumpReminderMentionClearResult,
  type BumpReminderMentionRoleResult,
  type BumpReminderMentionUserAddResult,
  type BumpReminderMentionUserRemoveResult,
  type BumpReminderMentionUsersClearResult,
} from "../types";
import type { BumpReminderStoreContext } from "./usecases/bumpReminderStoreContext";
import { getBumpReminderConfigUseCase } from "./usecases/getBumpReminderConfig";
import {
  mutateBumpReminderConfigUseCase,
  mutateBumpReminderMentionUsersUseCase,
} from "./usecases/mutateBumpReminderConfig";
import { setBumpReminderEnabledUseCase } from "./usecases/setBumpReminderEnabled";
import { updateBumpReminderConfigUseCase } from "./usecases/updateBumpReminderConfig";

/**
 * Guild単位のBumpリマインダー設定を永続化するストア
 */
export class GuildBumpReminderConfigStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly defaultLocale: string,
    private readonly safeJsonParse: <T>(json: string | null) => T | undefined,
  ) {}

  private getContext(): BumpReminderStoreContext {
    return {
      prisma: this.prisma,
      defaultLocale: this.defaultLocale,
      safeJsonParse: this.safeJsonParse,
    };
  }

  /**
   * BumpReminder設定を取得する
   * @param guildId 対象ギルドID
   * @returns BumpReminder設定（未設定時はnull）
   */
  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    return getBumpReminderConfigUseCase(this.getContext(), guildId);
  }

  /**
   * BumpReminderの有効/無効状態を更新する
   * @param guildId 対象ギルドID
   * @param enabled 有効状態
   * @param channelId 有効化時に設定するチャンネルID
   * @returns 実行完了
   */
  async setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void> {
    await setBumpReminderEnabledUseCase(
      this.getContext(),
      guildId,
      enabled,
      channelId,
    );
  }

  /**
   * BumpReminder設定全体を更新する
   * @param guildId 対象ギルドID
   * @param bumpReminderConfig 保存する設定
   * @returns 実行完了
   */
  async updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void> {
    await updateBumpReminderConfigUseCase(
      this.getContext(),
      guildId,
      bumpReminderConfig,
    );
  }

  /**
   * メンション対象ロールを設定/解除する
   * @param guildId 対象ギルドID
   * @param roleId 設定するロールID（undefined で解除）
   * @returns 更新結果
   */
  async setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult> {
    return mutateBumpReminderConfigUseCase(
      this.getContext(),
      guildId,
      (config) => {
        const mentionUserIds = Array.isArray(config.mentionUserIds)
          ? config.mentionUserIds
          : [];

        return {
          result: BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED,
          updatedConfig: {
            ...config,
            mentionRoleId: roleId,
            mentionUserIds,
          },
        };
      },
    );
  }

  /**
   * メンション対象ユーザーを追加する
   * @param guildId 対象ギルドID
   * @param userId 追加するユーザーID
   * @returns 追加結果
   */
  async addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult> {
    return mutateBumpReminderMentionUsersUseCase(
      this.getContext(),
      guildId,
      userId,
      BUMP_REMINDER_MENTION_USER_MODE.ADD,
    ) as Promise<BumpReminderMentionUserAddResult>;
  }

  /**
   * メンション対象ユーザーを削除する
   * @param guildId 対象ギルドID
   * @param userId 削除するユーザーID
   * @returns 削除結果
   */
  async removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult> {
    return mutateBumpReminderMentionUsersUseCase(
      this.getContext(),
      guildId,
      userId,
      BUMP_REMINDER_MENTION_USER_MODE.REMOVE,
    ) as Promise<BumpReminderMentionUserRemoveResult>;
  }

  /**
   * メンション対象ユーザー一覧をすべてクリアする
   * @param guildId 対象ギルドID
   * @returns クリア結果
   */
  async clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult> {
    return mutateBumpReminderConfigUseCase(
      this.getContext(),
      guildId,
      (config) => {
        const mentionUserIds = Array.isArray(config.mentionUserIds)
          ? config.mentionUserIds
          : [];

        // 既に空なら書き込みを省略
        if (mentionUserIds.length === 0) {
          return {
            result: BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.ALREADY_EMPTY,
            updatedConfig: {
              ...config,
              mentionUserIds,
            },
            skipWrite: true,
          };
        }

        return {
          result: BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.CLEARED,
          updatedConfig: {
            ...config,
            mentionUserIds: [],
          },
        };
      },
    );
  }

  /**
   * メンション対象ロール・ユーザーをすべてクリアする
   * @param guildId 対象ギルドID
   * @returns クリア結果
   */
  async clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult> {
    return mutateBumpReminderConfigUseCase(
      this.getContext(),
      guildId,
      (config) => {
        const mentionUserIds = Array.isArray(config.mentionUserIds)
          ? config.mentionUserIds
          : [];

        // 既に未設定なら書き込みを省略
        if (!config.mentionRoleId && mentionUserIds.length === 0) {
          return {
            result: BUMP_REMINDER_MENTION_CLEAR_RESULT.ALREADY_CLEARED,
            updatedConfig: {
              ...config,
              mentionRoleId: undefined,
              mentionUserIds,
            },
            skipWrite: true,
          };
        }

        return {
          result: BUMP_REMINDER_MENTION_CLEAR_RESULT.CLEARED,
          updatedConfig: {
            ...config,
            mentionRoleId: undefined,
            mentionUserIds: [],
          },
        };
      },
    );
  }
}
