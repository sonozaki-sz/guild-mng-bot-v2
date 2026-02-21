// src/shared/database/stores/usecases/updateBumpReminderConfig.ts
// BumpReminder設定全体更新ユースケース

import { DatabaseError } from "../../../errors";
import { tDefault } from "../../../locale";
import type { BumpReminderConfig } from "../../types";
import {
  BUMP_REMINDER_CAS_MAX_RETRIES,
  casUpdateBumpReminderConfig,
  fetchBumpReminderConfigSnapshot,
  initializeBumpReminderConfigIfMissing,
} from "../helpers/bumpReminderConfigCas";
import type { BumpReminderStoreContext } from "./bumpReminderStoreContext";

/**
 * BumpReminder設定をCAS方式で丸ごと更新する
 * @param context ストア実行コンテキスト
 * @param guildId 対象ギルドID
 * @param bumpReminderConfig 保存する設定
 * @returns 実行完了
 */
export async function updateBumpReminderConfigUseCase(
  context: BumpReminderStoreContext,
  guildId: string,
  bumpReminderConfig: BumpReminderConfig,
): Promise<void> {
  const nextJson = JSON.stringify(bumpReminderConfig);

  for (let attempt = 0; attempt < BUMP_REMINDER_CAS_MAX_RETRIES; attempt++) {
    const snapshot = await fetchBumpReminderConfigSnapshot(
      context.prisma,
      guildId,
    );
    const rawConfig = snapshot.rawConfig;

    if (rawConfig === nextJson) {
      return;
    }

    if (rawConfig === null) {
      const initialized = await initializeBumpReminderConfigIfMissing(
        context.prisma,
        guildId,
        context.defaultLocale,
        bumpReminderConfig,
        snapshot.recordExists,
      );
      if (initialized) {
        return;
      }
      continue;
    }

    const updated = await casUpdateBumpReminderConfig(
      context.prisma,
      guildId,
      rawConfig,
      nextJson,
    );

    if (updated) {
      return;
    }
  }

  throw new DatabaseError(
    tDefault("errors:database.update_config_failed") +
      `: bump reminder config update conflict (${guildId})`,
  );
}
