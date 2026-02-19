// src/bot/services/shared-access/featureAccess.ts
// shared features / repositories へのアクセス集約

import {
  getGuildConfigRepository,
  type IAfkRepository,
  type IBaseGuildRepository,
} from "../../../shared/database";

export {
  addCreatedVacChannel,
  addTriggerChannel,
  getVacConfigOrDefault,
  isManagedVacChannel,
  removeCreatedVacChannel,
  removeTriggerChannel,
  saveVacConfig,
} from "../../../shared/features/vac";

export {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  getBumpReminderConfigService,
} from "../../../shared/features/bump-reminder";

export type { BumpReminderConfig } from "../../../shared/features/bump-reminder";

export function getBotGuildConfigRepository(): IBaseGuildRepository &
  IAfkRepository {
  return getGuildConfigRepository();
}
