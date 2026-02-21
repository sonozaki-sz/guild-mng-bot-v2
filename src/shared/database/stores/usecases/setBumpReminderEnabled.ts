// src/shared/database/stores/usecases/setBumpReminderEnabled.ts
// BumpReminder有効状態更新ユースケース

import { DatabaseError } from "../../../errors";
import { tDefault } from "../../../locale";
import type { BumpReminderConfig } from "../../types";
import {
  BUMP_REMINDER_CAS_MAX_RETRIES,
  casUpdateBumpReminderConfig,
  createInitialBumpReminderConfig,
  fetchBumpReminderConfigSnapshot,
  initializeBumpReminderConfigIfMissing,
} from "../helpers/bumpReminderConfigCas";
import type { BumpReminderStoreContext } from "./bumpReminderStoreContext";

/**
 * BumpReminderの有効/無効状態をCAS方式で更新する
 * @param context ストア実行コンテキスト
 * @param guildId 対象ギルドID
 * @param enabled 有効状態
 * @param channelId 有効化時に設定するチャンネルID
 * @returns 実行完了
 */
export async function setBumpReminderEnabledUseCase(
  context: BumpReminderStoreContext,
  guildId: string,
  enabled: boolean,
  channelId?: string,
): Promise<void> {
  for (let attempt = 0; attempt < BUMP_REMINDER_CAS_MAX_RETRIES; attempt++) {
    const snapshot = await fetchBumpReminderConfigSnapshot(
      context.prisma,
      guildId,
    );

    const rawConfig = snapshot.rawConfig;
    const config = context.safeJsonParse<BumpReminderConfig>(rawConfig);

    if (!config) {
      const initialized = await initializeBumpReminderConfigIfMissing(
        context.prisma,
        guildId,
        context.defaultLocale,
        createInitialBumpReminderConfig(enabled, channelId),
        snapshot.recordExists,
      );
      if (initialized) {
        return;
      }
      continue;
    }

    const mentionUserIds = Array.isArray(config.mentionUserIds)
      ? config.mentionUserIds
      : [];

    const updatedConfig: BumpReminderConfig = {
      ...config,
      enabled,
      channelId: channelId ?? config.channelId,
      mentionUserIds,
    };

    const updatedJson = JSON.stringify(updatedConfig);
    if (updatedJson === rawConfig) {
      return;
    }

    const updated = await casUpdateBumpReminderConfig(
      context.prisma,
      guildId,
      rawConfig,
      updatedJson,
    );

    if (updated) {
      return;
    }
  }

  throw new DatabaseError(
    tDefault("errors:database.update_config_failed") +
      `: bump reminder enable update conflict (${guildId})`,
  );
}
