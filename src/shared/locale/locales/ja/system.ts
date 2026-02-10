// src/shared/locale/locales/ja/system.ts
// システムメッセージの翻訳リソース

export const system = {
  // Bot起動・シャットダウン
  "bot.starting": "Discord Botを起動しています...",
  "bot.commands.registering": "{{count}}個のコマンドを登録しています...",
  "bot.commands.registered": "コマンド登録完了。",
  "bot.events.registering": "{{count}}個のイベントを登録しています...",
  "bot.events.registered": "イベント登録完了。",
  "bot.startup.error": "Bot起動中にエラーが発生しました:",
  "bot.startup.failed": "Bot起動失敗:",
  "bot.client.initialized": "Discord Botクライアントを初期化しました。",
  "bot.client.shutting_down": "Botクライアントをシャットダウンしています...",
  "bot.client.shutdown_complete":
    "Botクライアントのシャットダウンが完了しました。",

  // エラーハンドリング
  "error.reply_failed": "エラーメッセージの送信に失敗しました。",
  "error.unhandled_rejection": "未処理のPromise拒否:",
  "error.uncaught_exception": "未処理の例外:",
  "error.unhandled_rejection_log": "未処理のPromise拒否:",
  "error.uncaught_exception_log": "未捕捉の例外:",
  "error.node_warning": "Node警告:",
  "error.cleanup_complete": "クリーンアップ完了。",
  "error.cleanup_failed": "クリーンアップ中のエラー:",

  // クールダウンマネージャー
  "cooldown.cleared_all": "すべてのクールダウンをクリアしました。",
  "cooldown.destroyed": "CooldownManagerを破棄しました。",
  "cooldown.reset":
    "クールダウンリセット: {{commandName}} (ユーザー: {{userId}})",
  "cooldown.cleared_for_command":
    "コマンドの全クールダウンをクリア: {{commandName}}",
  "cooldown.cleanup":
    "クリーンアップ: {{count}}個の期限切れクールダウンを削除しました。",

  // スケジューラー
  "scheduler.stopping": "すべてのスケジュール済みジョブを停止中...",
  "scheduler.job_exists":
    "Job {{jobId}} は既に存在します。古いJobを削除します。",
  "scheduler.executing_job": "Job実行中: {{jobId}}",
  "scheduler.job_completed": "Job完了: {{jobId}}",
  "scheduler.job_error": "Job {{jobId}} でエラー:",
  "scheduler.schedule_failed": "Job {{jobId}} のスケジュールに失敗:",
  "scheduler.job_removed": "Job削除: {{jobId}}",
  "scheduler.job_stopped": "Job停止: {{jobId}}",
  "scheduler.cancel_bump_reminder":
    "Guild {{guildId}} の既存のbump reminderをキャンセル中",
  "scheduler.bump_reminder_cancelled":
    "Guild {{guildId}} のbump reminderをキャンセルしました。",

  // シャットダウン
  "shutdown.signal_received":
    "{{signal}} を受信、適切にシャットダウンしています...",
  "shutdown.gracefully": "適切にシャットダウンしています...",
  "shutdown.sigterm": "SIGTERMを受信、シャットダウンしています...",

  // データベース操作ログ
  "database.get_config_log": "Guild {{guildId}} の設定取得に失敗:",
  "database.save_config_log": "Guild {{guildId}} の設定保存に失敗:",
  "database.saved_config": "Guild {{guildId}} の設定を保存しました。",
  "database.update_config_log": "Guild {{guildId}} の設定更新に失敗:",
  "database.updated_config": "Guild {{guildId}} の設定を更新しました。",
  "database.delete_config_log": "Guild {{guildId}} の設定削除に失敗:",
  "database.deleted_config": "Guild {{guildId}} の設定を削除しました。",
  "database.check_existence_log": "Guild {{guildId}} の存在確認に失敗:",

  // Webサーバー
  "web.server_started": "Web サーバーが起動しました: {{url}}",
  "web.startup_error": "Webサーバー起動エラー:",
  "web.unhandled_rejection": "未処理のPromise拒否:",
  "web.uncaught_exception": "未処理の例外:",
  "web.startup_failed": "Webサーバー起動失敗:",
  "web.api_error": "APIエラー:",
  "web.internal_server_error": "内部サーバーエラー",
} as const;

export type SystemTranslations = typeof system;
