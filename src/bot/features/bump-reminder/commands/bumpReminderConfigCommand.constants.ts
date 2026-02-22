// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.constants.ts
// bump-reminder-config コマンドの定数定義

// bump-reminder-config で共用するコマンド名/サブコマンド名/オプション名/選択値/CustomId接頭辞
export const BUMP_REMINDER_CONFIG_COMMAND = {
  NAME: "bump-reminder-config",
  SUBCOMMAND: {
    ENABLE: "enable",
    DISABLE: "disable",
    SET_MENTION: "set-mention",
    REMOVE_MENTION: "remove-mention",
    VIEW: "view",
  },
  OPTION: {
    ROLE: "role",
    USER: "user",
    TARGET: "target",
  },
  TARGET_VALUE: {
    ROLE: "role",
    USER: "user",
    USERS: "users",
    ALL: "all",
  },
  CUSTOM_ID_PREFIX: {
    REMOVE_USERS: "bump-remove-users-",
  },
} as const;
