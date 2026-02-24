// src/bot/features/bump-reminder/services/usecases/cancelBumpReminderUsecase.ts
// Bumpリマインダーキャンセルのユースケース

import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import {
  BUMP_REMINDER_STATUS,
  toBumpReminderKey,
  type BumpServiceName,
} from "../../constants/bumpReminderConstants";
import { type IBumpReminderRepository } from "../../repositories/types";
import {
  cancelScheduledReminder,
  type ScheduledReminderRef,
} from "../helpers/bumpReminderScheduleHelper";

type CancelBumpReminderUsecaseInput = {
  repository: IBumpReminderRepository;
  reminders: Map<string, ScheduledReminderRef>;
  guildId: string;
  serviceName?: BumpServiceName;
};

/**
 * ギルドのリマインダーをキャンセルする
 * @param input ユースケース入力
 * @returns キャンセルできた場合は true
 */
export async function cancelBumpReminderUsecase(
  input: CancelBumpReminderUsecaseInput,
): Promise<boolean> {
  const { repository, reminders, guildId, serviceName } = input;

  const reminderKey = toBumpReminderKey(guildId, serviceName);
  const reminder = cancelScheduledReminder(reminders, reminderKey);
  if (!reminder) {
    return false;
  }

  try {
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
