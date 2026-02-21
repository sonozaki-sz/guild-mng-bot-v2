// src/bot/features/bump-reminder/services/usecases/clearAllBumpRemindersUsecase.ts
// 全Bumpリマインダーのクリアユースケース

import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import { type ScheduledReminderRef } from "../helpers/bumpReminderScheduleHelper";

type ClearAllBumpRemindersUsecaseInput = {
  reminders: Map<string, ScheduledReminderRef>;
  cancelReminder: (guildId: string) => Promise<boolean>;
};

/**
 * すべてのリマインダーをクリアする
 * @param input ユースケース入力
 * @returns 実行完了を示す Promise
 */
export async function clearAllBumpRemindersUsecase(
  input: ClearAllBumpRemindersUsecaseInput,
): Promise<void> {
  const { reminders, cancelReminder } = input;

  const guildIds = Array.from(reminders.keys());
  const results = await Promise.allSettled(
    guildIds.map((guildId) => cancelReminder(guildId)),
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
