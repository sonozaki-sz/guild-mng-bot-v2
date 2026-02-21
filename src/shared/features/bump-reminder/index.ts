// src/shared/features/bump-reminder/index.ts
// Bumpリマインダー設定機能の標準エントリーポイント

// 外部公開 API（設定取得/更新ユースケース）
export {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BumpReminderConfigService,
  DEFAULT_BUMP_REMINDER_CONFIG,
  addBumpReminderMentionUser,
  clearBumpReminderMentionUsers,
  clearBumpReminderMentions,
  createBumpReminderConfigService,
  getBumpReminderConfig,
  getBumpReminderConfigOrDefault,
  getBumpReminderConfigService,
  removeBumpReminderMentionUser,
  saveBumpReminderConfig,
  setBumpReminderEnabled,
  setBumpReminderMentionRole,
} from "./bumpReminderConfigService";
export type {
  BumpReminderConfig,
  BumpReminderMentionClearResult,
  BumpReminderMentionRoleResult,
  BumpReminderMentionUserAddResult,
  BumpReminderMentionUserRemoveResult,
  BumpReminderMentionUsersClearResult,
} from "./bumpReminderConfigService";
