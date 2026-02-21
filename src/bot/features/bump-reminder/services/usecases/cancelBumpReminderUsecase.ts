// src/bot/features/bump-reminder/services/usecases/cancelBumpReminderUsecase.ts
// Bumpリマインダーキャンセルのユースケース

import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import { BUMP_REMINDER_STATUS } from "../../constants/bumpReminderConstants";
import { type IBumpReminderRepository } from "../../repositories/types";
import {
  cancelScheduledReminder,
  type ScheduledReminderRef,
} from "../helpers/bumpReminderScheduleHelper";

type CancelBumpReminderUsecaseInput = {
  repository: IBumpReminderRepository;
  reminders: Map<string, ScheduledReminderRef>;
  guildId: string;
};

/**
 * ギルドのリマインダーをキャンセルする
 * @param input ユースケース入力
 * @returns キャンセルできた場合は true
 */
export async function cancelBumpReminderUsecase(
  input: CancelBumpReminderUsecaseInput,
): Promise<boolean> {
  const { repository, reminders, guildId } = input;

  const reminder = cancelScheduledReminder(reminders, guildId);
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
