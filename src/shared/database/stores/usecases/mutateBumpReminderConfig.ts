// src/shared/database/stores/usecases/mutateBumpReminderConfig.ts
// BumpReminder設定更新ユースケース

import { DatabaseError } from "../../../errors/customErrors";
import { tDefault } from "../../../locale/localeManager";
import {
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_MODE,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  type BumpReminderConfig,
  type BumpReminderMentionClearResult,
  type BumpReminderMentionRoleResult,
  type BumpReminderMentionUserAddResult,
  type BumpReminderMentionUserMode,
  type BumpReminderMentionUserRemoveResult,
  type BumpReminderMentionUsersClearResult,
} from "../../types";
import {
  BUMP_REMINDER_CAS_MAX_RETRIES,
  casUpdateBumpReminderConfig,
  createInitialBumpReminderConfig,
  fetchBumpReminderConfigSnapshot,
  initializeBumpReminderConfigIfMissing,
} from "../helpers/bumpReminderConfigCas";
import type { BumpReminderStoreContext } from "./bumpReminderStoreContext";

/**
 * CAS方式でBumpReminder設定を更新する共通ミューテータを実行する
 * @param context ストア実行コンテキスト
 * @param guildId 対象ギルドID
 * @param mutator 設定更新ロジック
 * @returns 更新結果または未設定結果
 */
export async function mutateBumpReminderConfigUseCase<
  TResult extends
    | BumpReminderMentionRoleResult
    | BumpReminderMentionUsersClearResult
    | BumpReminderMentionClearResult,
>(
  context: BumpReminderStoreContext,
  guildId: string,
  mutator: (config: BumpReminderConfig) => {
    result: TResult;
    updatedConfig: BumpReminderConfig;
    skipWrite?: boolean;
  },
): Promise<TResult | typeof BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED> {
  for (let attempt = 0; attempt < BUMP_REMINDER_CAS_MAX_RETRIES; attempt++) {
    const snapshot = await fetchBumpReminderConfigSnapshot(
      context.prisma,
      guildId,
    );
    const rawConfig = snapshot.rawConfig;
    const config = context.safeJsonParse<BumpReminderConfig>(rawConfig);

    if (!config) {
      if (rawConfig !== null) {
        return BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED;
      }

      const initialized = await initializeBumpReminderConfigIfMissing(
        context.prisma,
        guildId,
        context.defaultLocale,
        createInitialBumpReminderConfig(),
        snapshot.recordExists,
      );
      if (initialized) {
        continue;
      }

      continue;
    }

    const mutation = mutator(config);
    if (mutation.skipWrite) {
      return mutation.result;
    }

    const updated = await casUpdateBumpReminderConfig(
      context.prisma,
      guildId,
      rawConfig,
      mutation.updatedConfig,
    );

    if (updated) {
      return mutation.result;
    }
  }

  throw new DatabaseError(
    tDefault("errors:database.update_config_failed") +
      `: bump reminder config update conflict (${guildId})`,
  );
}

/**
 * ユーザーメンション対象の追加/削除をCAS方式で更新する
 * @param context ストア実行コンテキスト
 * @param guildId 対象ギルドID
 * @param userId 操作対象ユーザーID
 * @param mode 追加または削除モード
 * @returns 操作結果
 */
export async function mutateBumpReminderMentionUsersUseCase(
  context: BumpReminderStoreContext,
  guildId: string,
  userId: string,
  mode: BumpReminderMentionUserMode,
): Promise<
  BumpReminderMentionUserAddResult | BumpReminderMentionUserRemoveResult
> {
  for (let attempt = 0; attempt < BUMP_REMINDER_CAS_MAX_RETRIES; attempt++) {
    const snapshot = await fetchBumpReminderConfigSnapshot(
      context.prisma,
      guildId,
    );
    const rawConfig = snapshot.rawConfig;
    const config = context.safeJsonParse<BumpReminderConfig>(rawConfig);

    if (!config) {
      if (rawConfig !== null) {
        return BUMP_REMINDER_MENTION_USER_ADD_RESULT.NOT_CONFIGURED;
      }

      const initialized = await initializeBumpReminderConfigIfMissing(
        context.prisma,
        guildId,
        context.defaultLocale,
        createInitialBumpReminderConfig(),
        snapshot.recordExists,
      );
      if (initialized) {
        continue;
      }

      continue;
    }

    const mentionUserIds = Array.isArray(config.mentionUserIds)
      ? config.mentionUserIds
      : [];
    const exists = mentionUserIds.includes(userId);

    if (mode === BUMP_REMINDER_MENTION_USER_MODE.ADD && exists) {
      return BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS;
    }
    if (mode === BUMP_REMINDER_MENTION_USER_MODE.REMOVE && !exists) {
      return BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_FOUND;
    }

    const nextMentionUserIds =
      mode === BUMP_REMINDER_MENTION_USER_MODE.ADD
        ? [...mentionUserIds, userId]
        : mentionUserIds.filter((id) => id !== userId);

    const updatedConfig: BumpReminderConfig = {
      ...config,
      mentionUserIds: nextMentionUserIds,
    };

    const updated = await casUpdateBumpReminderConfig(
      context.prisma,
      guildId,
      rawConfig,
      updatedConfig,
    );

    if (updated) {
      return mode === BUMP_REMINDER_MENTION_USER_MODE.ADD
        ? BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED
        : BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED;
    }
  }

  throw new DatabaseError(
    tDefault("errors:database.update_config_failed") +
      `: bump reminder mention user update conflict (${guildId})`,
  );
}
