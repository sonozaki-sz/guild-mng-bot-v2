// src/shared/locale/locales/ja/system.ts
// システムメッセージの翻訳リソース

export const system = {
  // Bot起動・シャットダウン
  "bot.starting": "Discord Botを起動しています...",
  "bot.commands.registering": "{{count}}個のコマンドを登録しています...",
  "bot.commands.registered": "コマンド登録完了。",
  "bot.commands.command_registered": "  ✓ /{{name}}",
  "bot.events.registering": "{{count}}個のイベントを登録しています...",
  "bot.events.registered": "イベント登録完了。",
  "bot.startup.error": "Bot起動中にエラーが発生しました:",
  "bot.startup.failed": "Bot起動失敗:",
  "bot.client.initialized": "Discord Botクライアントを初期化しました。",
  "bot.client.shutting_down": "Botクライアントをシャットダウンしています...",
  "bot.client.shutdown_complete":
    "Botクライアントのシャットダウンが完了しました。",
  "bot.presence_activity": "{{count}}個のサーバーで稼働中 | by sonozaki-sz",

  // Bumpリマインダー検知ログ
  "bump-reminder.detected":
    "Guild {{guildId}} でBumpを検知しました ({{service}})",
  "bump-reminder.detection_failed": "Guild {{guildId}} のBump検知処理に失敗:",

  // ログメッセージ
  // Bump 設定変更監査ログ
  // `log.*` は主に管理コマンド経由の操作監査で利用する
  "log.bump_reminder_enabled":
    "Guild {{guildId}} でBumpリマインダーを有効化しました（Channel: {{channelId}}）",
  "log.bump_reminder_disabled":
    "Guild {{guildId}} でBumpリマインダーを無効化しました",
  "log.bump_reminder_mention_set":
    "Guild {{guildId}} でBumpリマインダーのメンションロールを設定しました（Role: {{roleId}}）",
  "log.bump_reminder_mention_removed":
    "Guild {{guildId}} でBumpリマインダーのメンション設定を削除しました（対象: {{target}}）",
  "log.bump_reminder_users_removed":
    "Guild {{guildId}} でBumpリマインダーから{{count}}人のユーザーを削除しました",

  // エラーハンドリング
  "error.reply_failed": "エラーメッセージの送信に失敗しました。",
  "error.unhandled_rejection": "未処理のPromise拒否:",
  "error.uncaught_exception": "未処理の例外:",
  "error.unhandled_rejection_log": "未処理のPromise拒否:",
  "error.uncaught_exception_log": "未捕捉の例外:",
  "error.node_warning": "Node警告:",
  "error.cleanup_complete": "クリーンアップ完了。",
  "error.cleanup_failed": "クリーンアップ中のエラー:",

  // ロケール
  "locale.manager_initialized": "LocaleManagerをi18nextで初期化しました。",

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
  // 汎用ジョブ実行ログ
  // リマインダー以外も含む共通ジョブ実行トレース
  "scheduler.stopping": "すべてのスケジュール済みジョブを停止中...",
  "scheduler.job_exists":
    "Job {{jobId}} は既に存在します。古いJobを削除します。",
  "scheduler.executing_job": "Job実行中: {{jobId}}",
  "scheduler.job_completed": "Job完了: {{jobId}}",
  "scheduler.job_error": "Job {{jobId}} でエラー:",
  "scheduler.schedule_failed": "Job {{jobId}} のスケジュールに失敗:",
  "scheduler.job_removed": "Job削除: {{jobId}}",
  "scheduler.job_stopped": "Job停止: {{jobId}}",
  "scheduler.job_scheduled": "Jobスケジュール完了: {{jobId}}",
  // Bump リマインダーのスケジューリング/復元ログ
  // スケジュール→実行→復元→重複解消の順でキーを並べ、運用時の参照順を固定する
  "scheduler.bump_reminder_task_failed":
    "Guild {{guildId}} のBumpリマインダータスクが失敗しました:",
  "scheduler.bump_reminder_description":
    "Guild {{guildId}} のBumpリマインダー (実行時刻: {{executeAt}})",
  "scheduler.bump_reminder_scheduled":
    "Guild {{guildId}} のBumpリマインダーを{{minutes}}分後にスケジュールしました。",
  "scheduler.cancel_bump_reminder":
    "Guild {{guildId}} の既存のbump reminderをキャンセル中",
  "scheduler.bump_reminder_cancelled":
    "Guild {{guildId}} のbump reminderをキャンセルしました。",
  "scheduler.bump_reminder_executing_immediately":
    "Guild {{guildId}} の期限切れBumpリマインダーを即座に実行します",
  "scheduler.bump_reminders_restored":
    "DBから{{count}}個の保留中Bumpリマインダーを復元しました",
  "scheduler.bump_reminder_sent":
    "Guild {{guildId}} のChannel {{channelId}} にBumpリマインダーを送信しました",
  "scheduler.bump_reminder_channel_not_found":
    "Guild {{guildId}} のChannel {{channelId}} が見つかりません",
  "scheduler.bump_reminder_disabled":
    "Guild {{guildId}} のBumpリマインダーは無効化されています",
  "scheduler.bump_reminder_restore_failed": "Bumpリマインダーの復元に失敗:",
  "scheduler.bump_reminder_duplicates_cancelled":
    "重複する保留中のBumpリマインダー {{count}} 件をキャンセルしました",
  // パネル同期・チャンネル整合性チェック関連ログ
  // パネル関連キーは近接配置して grep 時の追跡コストを下げる
  "scheduler.bump_reminder_unregistered_channel":
    "Guild {{guildId}} の未登録チャンネル {{channelId}} でBumpを検知したためスキップします（設定: {{expectedChannelId}}）",
  "scheduler.bump_reminder_orphaned_panel_delete_failed":
    "孤立したBumpパネルメッセージ {{panelMessageId}} の削除に失敗しました",
  "scheduler.bump_reminder_panel_deleted":
    "Guild {{guildId}} のBumpパネルメッセージ {{panelMessageId}} を削除しました",
  "scheduler.bump_reminder_panel_delete_failed":
    "Bumpパネルメッセージ {{panelMessageId}} の削除に失敗しました",
  "scheduler.bump_reminder_panel_send_failed": "Bumpパネルの送信に失敗しました",

  // シャットダウン
  "shutdown.signal_received":
    "{{signal}} を受信、適切にシャットダウンしています...",
  "shutdown.gracefully": "適切にシャットダウンしています...",
  "shutdown.sigterm": "SIGTERMを受信、シャットダウンしています...",

  // データベース操作ログ
  // GuildConfig 操作ログ
  "database.get_config_log": "Guild {{guildId}} の設定取得に失敗:",
  "database.save_config_log": "Guild {{guildId}} の設定保存に失敗:",
  "database.saved_config": "Guild {{guildId}} の設定を保存しました。",
  "database.update_config_log": "Guild {{guildId}} の設定更新に失敗:",
  "database.updated_config": "Guild {{guildId}} の設定を更新しました。",
  "database.delete_config_log": "Guild {{guildId}} の設定削除に失敗:",
  "database.deleted_config": "Guild {{guildId}} の設定を削除しました。",
  "database.check_existence_log": "Guild {{guildId}} の存在確認に失敗:",

  // Bumpリマインダーデータベース操作
  // BumpReminder テーブル操作ログ
  // リマインダー永続化レコードのライフサイクルログ
  "database.bump_reminder_created":
    "Bumpリマインダーを作成しました: {{id}} (Guild: {{guildId}})",
  "database.bump_reminder_create_failed":
    "Guild {{guildId}} のBumpリマインダー作成に失敗:",
  "database.bump_reminder_find_failed": "Bumpリマインダー {{id}} の取得に失敗:",
  "database.bump_reminder_find_all_failed":
    "保留中のBumpリマインダーの取得に失敗:",
  "database.bump_reminder_status_updated":
    "Bumpリマインダー {{id}} のステータスを {{status}} に更新しました",
  "database.bump_reminder_update_failed":
    "Bumpリマインダー {{id}} の更新に失敗:",
  "database.bump_reminder_deleted": "Bumpリマインダーを削除: {{id}}",
  "database.bump_reminder_delete_failed":
    "Bumpリマインダー {{id}} の削除に失敗:",
  "database.bump_reminder_cancelled_by_guild":
    "Guild {{guildId}} の保留中Bumpリマインダーをキャンセルしました",
  "database.bump_reminder_cancelled_by_channel":
    "Guild {{guildId}} / Channel {{channelId}} の保留中Bumpリマインダーをキャンセルしました",
  "database.bump_reminder_cancel_failed":
    "Guild {{guildId}} のBumpリマインダーキャンセルに失敗:",
  "database.bump_reminder_cleanup_completed":
    "{{count}}個の古いBumpリマインダーをクリーンアップしました（{{days}}日以前）",
  "database.bump_reminder_cleanup_failed":
    "古いBumpリマインダーのクリーンアップに失敗:",

  // Bot起動イベントログ
  // 起動完了時のサマリーログ
  "ready.bot_ready": "✅ Botの準備が完了しました！ {{tag}} としてログイン",
  "ready.servers": "📊 サーバー数: {{count}}",
  "ready.users": "👥 ユーザー数: {{count}}",
  "ready.commands": "💬 コマンド数: {{count}}",
  "ready.event_registered": "イベント登録: {{name}}",

  // インタラクションイベントログ
  // command / modal / button / select 実行トレース
  // 実行成功/失敗を横断的に追跡するためのキー群
  // interaction.* は flow 層のログキーと1:1対応を維持する
  "interaction.unknown_command": "不明なコマンド: {{commandName}}",
  "interaction.command_executed":
    "コマンド実行: {{commandName}} (実行者: {{userTag}})",
  "interaction.command_error": "コマンド {{commandName}} の実行エラー:",
  "interaction.autocomplete_error": "{{commandName}} の自動補完エラー:",
  "interaction.unknown_modal": "不明なモーダル: {{customId}}",
  "interaction.modal_submitted":
    "モーダル送信: {{customId}} (送信者: {{userTag}})",
  "interaction.modal_error": "モーダル {{customId}} の実行エラー:",
  "interaction.button_error": "ボタン {{customId}} の実行エラー:",
  "interaction.select_menu_error":
    "セレクトメニュー {{customId}} の実行エラー:",

  // AFKコマンドログ
  "afk.moved_log":
    "Guild {{guildId}} でユーザー {{userId}} を {{channelId}} に移動。",
  "afk.configured_log":
    "Guild {{guildId}} でAFKチャンネル設定, channel {{channelId}}",

  // VACログ
  // voiceState / channel lifecycle / panel 操作ログ
  // VAC 実行時ログは運用確認のため近接配置を維持する
  "vac.voice_state_update_failed": "VACのvoiceStateUpdate処理に失敗:",
  "vac.channel_created":
    "Guild {{guildId}} でVACチャンネルを作成（Channel: {{channelId}}, Owner: {{ownerId}}）",
  "vac.channel_deleted":
    "Guild {{guildId}} でVACチャンネルを削除（Channel: {{channelId}}）",
  "vac.category_full":
    "Guild {{guildId}} のカテゴリ {{categoryId}} はチャンネル上限に達しています",
  "vac.trigger_removed_by_delete":
    "Guild {{guildId}} で削除されたトリガーチャンネルを設定から除外（Channel: {{channelId}}）",
  "vac.channel_delete_sync_failed": "VACのchannelDelete同期処理に失敗:",
  "vac.panel_send_failed": "VAC操作パネルの送信に失敗:",
  "vac.startup_cleanup_failed": "VACの起動時クリーンアップに失敗:",

  // Webサーバー
  // 起動/例外処理
  // web.auth_* は API ミドルウェアの認証分岐と対応付ける
  "web.server_started": "Web サーバーが起動しました: {{url}}",
  "web.startup_error": "Webサーバー起動エラー:",
  "web.unhandled_rejection": "未処理のPromise拒否:",
  "web.uncaught_exception": "未処理の例外:",
  "web.startup_failed": "Webサーバー起動失敗:",
  "web.api_error": "APIエラー:",
  "web.internal_server_error": "内部サーバーエラー",
  // API認証（Bearer API Key）
  // 認証結果ログとAPI応答文言
  "web.auth_unauthorized": "[Auth] 未認証リクエスト: {{method}} {{url}}",
  "web.auth_invalid_token": "[Auth] 無効なトークン: {{method}} {{url}}",
  "web.auth_unauthorized_error": "Unauthorized",
  "web.auth_forbidden_error": "Forbidden",
  // Authorization ヘッダー不足/不正時の利用者向けガイダンス
  "web.auth_header_required":
    "Authorization: Bearer <api-key> ヘッダーが必要です",
  "web.auth_invalid_token_message": "無効なトークンです",
} as const;

export type SystemTranslations = typeof system;
