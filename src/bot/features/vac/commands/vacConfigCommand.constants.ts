// src/bot/features/vac/commands/vacConfigCommand.constants.ts
// VAC 設定コマンド定数

export const VAC_CONFIG_COMMAND = {
  NAME: "vac-config",
  SUBCOMMAND: {
    CREATE_TRIGGER: "create-trigger-vc",
    REMOVE_TRIGGER: "remove-trigger-vc",
    VIEW: "view",
  },
  OPTION: {
    CATEGORY: "category",
  },
  TARGET: {
    TOP: "TOP",
  },
  TRIGGER_CHANNEL_NAME: "CreateVC",
  CATEGORY_CHANNEL_LIMIT: 50,
} as const;
