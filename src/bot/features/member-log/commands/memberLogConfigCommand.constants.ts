// src/bot/features/member-log/commands/memberLogConfigCommand.constants.ts
// member-log-config コマンドの定数定義

/**
 * member-log-config コマンドで共用するコマンド名・サブコマンド名・オプション名定数
 */
export const MEMBER_LOG_CONFIG_COMMAND = {
  NAME: "member-log-config",
  SUBCOMMAND: {
    SET_CHANNEL: "set-channel",
    ENABLE: "enable",
    DISABLE: "disable",
    SET_JOIN_MESSAGE: "set-join-message",
    SET_LEAVE_MESSAGE: "set-leave-message",
    VIEW: "view",
  },
  OPTION: {
    CHANNEL: "channel",
    MESSAGE: "message",
  },
} as const;
