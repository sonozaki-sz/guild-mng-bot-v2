// src/bot/features/sticky-message/commands/stickyMessageCommand.constants.ts
// スティッキーメッセージコマンド定数

/**
 * スティッキーメッセージコマンドで使用するコマンド名・サブコマンド名・オプション名を一元管理する
 */
export const STICKY_MESSAGE_COMMAND = {
  NAME: "sticky-message",
  SUBCOMMAND: {
    SET: "set",
    REMOVE: "remove",
    LIST: "list",
  },
  OPTION: {
    CHANNEL: "channel",
    MESSAGE: "message",
    USE_EMBED: "use-embed",
    EMBED_TITLE: "embed-title",
    EMBED_DESCRIPTION: "embed-description",
    EMBED_COLOR: "embed-color",
  },
} as const;
