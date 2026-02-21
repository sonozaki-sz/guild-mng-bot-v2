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

  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    return getBumpReminderConfigUseCase(this.getContext(), guildId);
  }

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
