// src/bot/services/shared-access/index.ts
// shared-access の公開エントリーポイント

export {
  DatabaseError,
  ValidationError,
  handleCommandError,
  handleInteractionError,
  setupGlobalErrorHandlers,
  setupGracefulShutdown,
} from "./errorAccess";

export {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  addCreatedVacChannel,
  addTriggerChannel,
  getBotGuildConfigRepository,
  getBumpReminderConfigService,
  getVacConfigOrDefault,
  isManagedVacChannel,
  removeCreatedVacChannel,
  removeTriggerChannel,
  saveVacConfig,
} from "./featureAccess";
export type { BumpReminderConfig } from "./featureAccess";

export {
  getCommandLocalizations,
  getGuildTranslator,
  localeManager,
  tDefault,
  tGuild,
} from "./localeAccess";
export type { GuildTFunction } from "./localeAccess";
