// src/shared/locale/locales/ja/system.ts
// システムメッセージの翻訳リソース

export const system = {
  // Bot起動・シャットダウン
  "bot.starting": "Discord Botを起動しています...",
  "bot.commands.registering": "{{count}}個のコマンドを登録しています...",
  "bot.commands.registered": "コマンド登録完了",
  "bot.events.registering": "{{count}}個のイベントを登録しています...",
  "bot.events.registered": "イベント登録完了",
  "bot.startup.error": "Bot起動中にエラーが発生しました:",
  "bot.startup.failed": "Bot起動失敗:",
  "bot.client.initialized": "Discord Botクライアントを初期化しました",
  "bot.client.shutting_down": "Shutting down bot client...",
  "bot.client.shutdown_complete": "Bot client shut down successfully",

  // エラーハンドリング
  "error.reply_failed": "エラーメッセージの送信に失敗しました",
  "error.unhandled_rejection": "未処理のPromise拒否:",
  "error.uncaught_exception": "未処理の例外:",
  "error.unhandled_rejection_log": "Unhandled Promise Rejection:",
  "error.uncaught_exception_log": "Uncaught Exception:",
  "error.node_warning": "Node Warning:",
  "error.cleanup_complete": "Cleanup completed",
  "error.cleanup_failed": "Error during cleanup:",

  // ロケールマネージャー
  "locale.initialized": "LocaleManager initialized with i18next",

  // クールダウンマネージャー
  "cooldown.cleared_all": "All cooldowns cleared",
  "cooldown.destroyed": "CooldownManager destroyed",

  // スケジューラー
  "scheduler.stopping": "Stopping all scheduled jobs...",

  // シャットダウン
  "shutdown.signal_received":
    "{{signal}} received, shutting down gracefully...",
} as const;

export type SystemTranslations = typeof system;
