// src/shared/locale/locales/ja/system.ts
// システムメッセージの翻訳リソース

export const system = {
  // Bot起動・シャットダウン
  "bot.starting": "[Bot] Discord Botを起動しています...",
  "bot.commands.registering": "[Bot] {{count}}個のコマンドを登録しています...",
  "bot.commands.registered": "[Bot] コマンド登録完了。",
  "bot.commands.command_registered": "  ✓ /{{name}}",
  "bot.events.registering": "[Bot] {{count}}個のイベントを登録しています...",
  "bot.events.registered": "[Bot] イベント登録完了。",
  "bot.startup.error": "[Bot] 起動中にエラーが発生しました:",
  "bot.startup.failed": "[Bot] 起動失敗:",
  "bot.client.initialized": "[Bot] Discord Botクライアントを初期化しました。",
  "bot.client.shutting_down":
    "[Bot] Botクライアントをシャットダウンしています...",
  "bot.client.shutdown_complete":
    "[Bot] Botクライアントのシャットダウンが完了しました。",
  "bot.presence_activity": "{{count}}個のサーバーで稼働中 | by sonozaki-sz",

  // Bumpリマインダー検知ログ
  "bump-reminder.detected":
    "[Bumpリマインダー機能] Bumpを検知 GuildId: {{guildId}} Service: {{service}}",
  "bump-reminder.detection_failed":
    "[Bumpリマインダー機能] Bump検知処理に失敗 GuildId: {{guildId}}",
  // Bump パネルボタン操作ログ
  "bump-reminder.panel_mention_updated":
    "[Bumpリマインダー機能] メンション {{action}} UserId: {{userId}} GuildId: {{guildId}}",
  "bump-reminder.panel_handle_failed":
    "[Bumpリマインダー機能] パネルボタン処理失敗",
  "bump-reminder.panel_reply_failed":
    "[Bumpリマインダー機能] パネルボタン エラー返信失敗",
  // Bumpリマインダー設定コマンド操作ログ
  // `config_*` は管理コマンド経由の操作監査で利用する
  "bump-reminder.config_enabled":
    "[Bumpリマインダー機能] 有効化 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "bump-reminder.config_disabled":
    "[Bumpリマインダー機能] 無効化 GuildId: {{guildId}}",
  "bump-reminder.config_mention_set":
    "[Bumpリマインダー機能] メンションロール設定 GuildId: {{guildId}} RoleId: {{roleId}}",
  "bump-reminder.config_mention_removed":
    "[Bumpリマインダー機能] メンション設定削除 GuildId: {{guildId}} Target: {{target}}",
  "bump-reminder.config_users_removed":
    "[Bumpリマインダー機能] メンションユーザー削除 GuildId: {{guildId}} UserIds: {{userIds}}",

  // エラーハンドリング
  "error.reply_failed": "[Bot] エラーメッセージの送信に失敗しました。",
  "error.unhandled_rejection": "[Bot] 未処理のPromise拒否:",
  "error.uncaught_exception": "[Bot] 未処理の例外:",
  "error.unhandled_rejection_log": "[Bot] 未処理のPromise拒否:",
  "error.uncaught_exception_log": "[Bot] 未捕捉の例外:",
  "error.node_warning": "[Bot] Node警告:",
  "error.global_handlers_already_registered":
    "[Bot] グローバルエラーハンドラーは既に登録済みです。スキップします。",
  "error.shutdown_handlers_already_registered":
    "[Bot] グレースフルシャットダウンハンドラーは既に登録済みです。スキップします。",

  // ロケール
  "locale.manager_initialized":
    "[Bot] LocaleManagerをi18nextで初期化しました。",

  // クールダウンマネージャー
  "cooldown.cleared_all":
    "[クールダウンマネージャー] すべてのクールダウンをクリアしました。",
  "cooldown.destroyed":
    "[クールダウンマネージャー] CooldownManager を破棄しました。",
  "cooldown.reset":
    "[クールダウンマネージャー] リセット CommandName: {{commandName}} UserId: {{userId}}",
  "cooldown.cleared_for_command":
    "[クールダウンマネージャー] コマンドの全クールダウンをクリア CommandName: {{commandName}}",
  "cooldown.cleanup":
    "[クールダウンマネージャー] {{count}}個の期限切れクールダウンを削除しました。",

  // スケジューラー
  // 汎用ジョブ実行ログ
  // リマインダー以外も含む共通ジョブ実行トレース
  "scheduler.stopping":
    "[スケジューラー] すべてのスケジュール済みジョブを停止中...",
  "scheduler.job_exists":
    "[スケジューラー] Job既存のため古いJobを削除 JobId: {{jobId}}",
  "scheduler.executing_job": "[スケジューラー] Job実行中 JobId: {{jobId}}",
  "scheduler.job_completed": "[スケジューラー] Job完了 JobId: {{jobId}}",
  "scheduler.job_error": "[スケジューラー] Jobエラー JobId: {{jobId}}",
  "scheduler.schedule_failed":
    "[スケジューラー] Jobスケジュール失敗 JobId: {{jobId}}",
  "scheduler.job_removed": "[スケジューラー] Job削除 JobId: {{jobId}}",
  "scheduler.job_stopped": "[スケジューラー] Job停止 JobId: {{jobId}}",
  "scheduler.job_scheduled":
    "[スケジューラー] Jobスケジュール完了 JobId: {{jobId}}",
  // Bump リマインダーのスケジューリング/復元ログ
  // スケジュール→実行→復元→重複解消の順でキーを並べ、運用時の参照順を固定する
  "scheduler.bump_reminder_task_failed":
    "[Bumpリマインダー機能] タスク失敗 GuildId: {{guildId}}",
  "scheduler.bump_reminder_description":
    "[Bumpリマインダー機能] GuildId: {{guildId}} ExecuteAt: {{executeAt}}",
  "scheduler.bump_reminder_scheduled":
    "[Bumpリマインダー機能] スケジュール登録 GuildId: {{guildId}} Minutes: {{minutes}}",
  "scheduler.bump_reminder_cancelling":
    "[Bumpリマインダー機能] 既存リマインダーをキャンセル中 GuildId: {{guildId}}",
  "scheduler.bump_reminder_cancelled":
    "[Bumpリマインダー機能] リマインダーをキャンセルしました GuildId: {{guildId}}",
  "scheduler.bump_reminder_executing_immediately":
    "[Bumpリマインダー機能] 期限切れリマインダーを即座に実行 GuildId: {{guildId}}",
  "scheduler.bump_reminders_restored":
    "[Bumpリマインダー機能] 保留中リマインダーを復元 Count: {{count}}",
  "scheduler.bump_reminder_sent":
    "[Bumpリマインダー機能] リマインダーを送信 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_channel_not_found":
    "[Bumpリマインダー機能] チャンネルが見つかりません GuildId: {{guildId}} ChannelId: {{channelId}}",
  "scheduler.bump_reminder_disabled":
    "[Bumpリマインダー機能] 無効化されています GuildId: {{guildId}}",
  "scheduler.bump_reminder_restore_failed":
    "[Bumpリマインダー機能] 復元に失敗:",
  "scheduler.bump_reminder_duplicates_cancelled":
    "[Bumpリマインダー機能] 重複リマインダーをキャンセル Count: {{count}}",
  // パネル同期・チャンネル整合性チェック関連ログ
  // パネル関連キーは近接配置して grep 時の追跡コストを下げる
  "scheduler.bump_reminder_unregistered_channel":
    "[Bumpリマインダー機能] 未登録チャンネルのためスキップ GuildId: {{guildId}} ChannelId: {{channelId}} ExpectedChannelId: {{expectedChannelId}}",
  "scheduler.bump_reminder_orphaned_panel_delete_failed":
    "[Bumpリマインダー機能] 孤立パネルメッセージ削除失敗 PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_deleted":
    "[Bumpリマインダー機能] パネルメッセージを削除 GuildId: {{guildId}} PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_delete_failed":
    "[Bumpリマインダー機能] パネルメッセージ削除失敗 PanelMessageId: {{panelMessageId}}",
  "scheduler.bump_reminder_panel_send_failed":
    "[Bumpリマインダー機能] パネルの送信に失敗",

  // シャットダウン
  "shutdown.signal_received":
    "[Bot] {{signal}} を受信、適切にシャットダウンしています...",
  "shutdown.already_in_progress":
    "[Bot] {{signal}} を受信しましたが、シャットダウンは既に進行中です。",
  "shutdown.cleanup_complete": "[Bot] クリーンアップ完了。",
  "shutdown.cleanup_failed": "[Bot] クリーンアップ中のエラー:",
  "shutdown.gracefully": "[Bot] 適切にシャットダウンしています...",
  "shutdown.sigterm": "[Bot] SIGTERMを受信、シャットダウンしています...",

  // データベース操作ログ
  // Prisma クライアント
  "database.prisma_not_available":
    "[データベース] Prismaクライアントが利用できません",
  // GuildConfig 操作ログ
  "database.get_config_log":
    "[データベース] 設定取得に失敗 GuildId: {{guildId}}",
  "database.save_config_log":
    "[データベース] 設定保存に失敗 GuildId: {{guildId}}",
  "database.saved_config":
    "[データベース] 設定を保存しました GuildId: {{guildId}}",
  "database.update_config_log":
    "[データベース] 設定更新に失敗 GuildId: {{guildId}}",
  "database.updated_config":
    "[データベース] 設定を更新しました GuildId: {{guildId}}",
  "database.delete_config_log":
    "[データベース] 設定削除に失敗 GuildId: {{guildId}}",
  "database.deleted_config":
    "[データベース] 設定を削除しました GuildId: {{guildId}}",
  "database.check_existence_log":
    "[データベース] 存在確認に失敗 GuildId: {{guildId}}",

  // Bumpリマインダーデータベース操作
  // BumpReminder テーブル操作ログ
  // リマインダー永続化レコードのライフサイクルログ
  "database.bump_reminder_created":
    "[データベース] Bumpリマインダーを作成 Id: {{id}} GuildId: {{guildId}}",
  "database.bump_reminder_create_failed":
    "[データベース] Bumpリマインダー作成に失敗 GuildId: {{guildId}}",
  "database.bump_reminder_find_failed":
    "[データベース] Bumpリマインダー取得に失敗 Id: {{id}}",
  "database.bump_reminder_find_all_failed":
    "[データベース] 保留中Bumpリマインダーの取得に失敗",
  "database.bump_reminder_status_updated":
    "[データベース] Bumpリマインダーのステータスを更新 Id: {{id}} Status: {{status}}",
  "database.bump_reminder_update_failed":
    "[データベース] Bumpリマインダー更新に失敗 Id: {{id}}",
  "database.bump_reminder_deleted":
    "[データベース] Bumpリマインダーを削除 Id: {{id}}",
  "database.bump_reminder_delete_failed":
    "[データベース] Bumpリマインダー削除に失敗 Id: {{id}}",
  "database.bump_reminder_cancelled_by_guild":
    "[データベース] 保留中Bumpリマインダーをキャンセル GuildId: {{guildId}}",
  "database.bump_reminder_cancelled_by_channel":
    "[データベース] 保留中Bumpリマインダーをキャンセル GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.bump_reminder_cancel_failed":
    "[データベース] Bumpリマインダーキャンセルに失敗 GuildId: {{guildId}}",
  "database.bump_reminder_cleanup_completed":
    "[データベース] 古いBumpリマインダーをクリーンアップ Count: {{count}} Days: {{days}}",
  "database.bump_reminder_cleanup_failed":
    "[データベース] 古いBumpリマインダーのクリーンアップに失敗",

  // スティッキーメッセージデータベース操作
  // StickyMessage テーブル操作ログ
  "database.sticky_message_find_by_channel_failed":
    "[データベース] スティッキーメッセージ取得に失敗 ChannelId: {{channelId}}",
  "database.sticky_message_find_all_by_guild_failed":
    "[データベース] スティッキーメッセージ全件取得に失敗 GuildId: {{guildId}}",
  "database.sticky_message_create_failed":
    "[データベース] スティッキーメッセージ作成に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.sticky_message_update_last_message_id_failed":
    "[データベース] スティッキーメッセージ lastMessageId 更新に失敗 Id: {{id}}",
  "database.sticky_message_update_content_failed":
    "[データベース] スティッキーメッセージ内容更新に失敗 Id: {{id}}",
  "database.sticky_message_delete_failed":
    "[データベース] スティッキーメッセージ削除に失敗 Id: {{id}}",
  "database.sticky_message_delete_by_channel_failed":
    "[データベース] スティッキーメッセージ削除に失敗 ChannelId: {{channelId}}",

  // VAC DB操作ログ
  "database.vac_trigger_added":
    "[データベース] VACトリガーチャンネルを追加 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_add_failed":
    "[データベース] VACトリガーチャンネル追加に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_removed":
    "[データベース] VACトリガーチャンネルを削除 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_trigger_remove_failed":
    "[データベース] VACトリガーチャンネル削除に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.vac_channel_registered":
    "[データベース] VAC管理チャンネルを登録 GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_register_failed":
    "[データベース] VAC管理チャンネル登録に失敗 GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_unregistered":
    "[データベース] VAC管理チャンネルを削除 GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",
  "database.vac_channel_unregister_failed":
    "[データベース] VAC管理チャンネル削除に失敗 GuildId: {{guildId}} ChannelId: {{voiceChannelId}}",

  // AFK DB操作ログ
  "database.afk_channel_set":
    "[データベース] AFKチャンネルを設定 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.afk_channel_set_failed":
    "[データベース] AFKチャンネル設定に失敗 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "database.afk_config_saved":
    "[データベース] AFK設定を保存 GuildId: {{guildId}}",
  "database.afk_config_save_failed":
    "[データベース] AFK設定保存に失敗 GuildId: {{guildId}}",

  // Bot起動イベントログ
  // 起動完了時のサマリーログ
  "ready.bot_ready":
    "[Bot] ✅ Botの準備が完了しました！ {{tag}} としてログイン",
  "ready.servers": "[Bot] 📊 サーバー数: {{count}}",
  "ready.users": "[Bot] 👥 ユーザー数: {{count}}",
  "ready.commands": "[Bot] 💬 コマンド数: {{count}}",
  "ready.event_registered": "  ✓ {{name}}",

  // インタラクションイベントログ
  // command / modal / button / select 実行トレース
  // 実行成功/失敗を横断的に追跡するためのキー群
  // interaction.* は flow 層のログキーと1:1対応を維持する
  "interaction.unknown_command":
    "[Interactionイベント] 不明なコマンド CommandName: {{commandName}}",
  "interaction.command_executed":
    "[Interactionイベント] コマンド実行 CommandName: {{commandName}} UserTag: {{userTag}}",
  "interaction.command_error":
    "[Interactionイベント] コマンド実行エラー CommandName: {{commandName}}",
  "interaction.autocomplete_error":
    "[Interactionイベント] 自動補完エラー CommandName: {{commandName}}",
  "interaction.unknown_modal":
    "[Interactionイベント] 不明なモーダル CustomId: {{customId}}",
  "interaction.modal_submitted":
    "[Interactionイベント] モーダル送信 CustomId: {{customId}} UserTag: {{userTag}}",
  "interaction.modal_error":
    "[Interactionイベント] モーダル実行エラー CustomId: {{customId}}",
  "interaction.button_error":
    "[Interactionイベント] ボタン実行エラー CustomId: {{customId}}",
  "interaction.select_menu_error":
    "[Interactionイベント] セレクトメニュー実行エラー CustomId: {{customId}}",

  // スティッキーメッセージ機能ログ
  // handler / service 層のランタイムログ
  "sticky-message.channel_delete_cleanup":
    "[スティッキーメッセージ機能] channelDelete時クリーンアップ完了 ChannelId: {{channelId}}",
  "sticky-message.channel_delete_cleanup_failed":
    "[スティッキーメッセージ機能] channelDelete時レコード削除失敗 ChannelId: {{channelId}}",
  "sticky-message.create_handler_error":
    "[スティッキーメッセージ機能] messageCreate処理エラー ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.resend_scheduled_error":
    "[スティッキーメッセージ機能] 再送スケジュールエラー",
  "sticky-message.send_failed":
    "[スティッキーメッセージ機能] メッセージ送信失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.previous_deleted_or_not_found":
    "[スティッキーメッセージ機能] 前回メッセージ削除済みまたは未存在 ChannelId: {{channelId}}",
  "sticky-message.set_failed":
    "[スティッキーメッセージ機能] モーダルからの設定失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.set_embed_failed":
    "[スティッキーメッセージ機能] Embedモーダルからの設定失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.update_failed":
    "[スティッキーメッセージ機能] モーダルからの更新失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.update_embed_failed":
    "[スティッキーメッセージ機能] Embedモーダルからの更新失敗 ChannelId: {{channelId}} GuildId: {{guildId}}",
  "sticky-message.resend_after_update_failed":
    "[スティッキーメッセージ機能] 更新後の再送信失敗 ChannelId: {{channelId}}",
  "sticky-message.resend_after_embed_update_failed":
    "[スティッキーメッセージ機能] Embed更新後の再送信失敗 ChannelId: {{channelId}}",

  // AFKコマンドログ
  "afk.moved":
    "[AFK機能] ユーザーをAFKチャンネルに移動 GuildId: {{guildId}} UserId: {{userId}} ChannelId: {{channelId}}",
  "afk.configured":
    "[AFK機能] AFKチャンネル設定 GuildId: {{guildId}} ChannelId: {{channelId}}",

  // VACログ
  // voiceState / channel lifecycle / panel 操作ログ
  // VAC 実行時ログは運用確認のため近接配置を維持する
  "vac.voice_state_update_failed": "[VAC機能] voiceStateUpdate処理失敗",
  "vac.channel_created":
    "[VAC機能] VCチャンネル作成 GuildId: {{guildId}} ChannelId: {{channelId}} OwnerId: {{ownerId}}",
  "vac.channel_deleted":
    "[VAC機能] VCチャンネル削除 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.category_full":
    "[VAC機能] カテゴリがチャンネル上限に達しました GuildId: {{guildId}} CategoryId: {{categoryId}}",
  "vac.trigger_removed_by_delete":
    "[VAC機能] 削除されたトリガーチャンネルを設定から除外 GuildId: {{guildId}} ChannelId: {{channelId}}",
  "vac.channel_delete_sync_failed": "[VAC機能] channelDelete同期処理失敗",
  "vac.panel_send_failed": "[VAC機能] 操作パネル送信失敗",
  "vac.startup_cleanup_failed": "[VAC機能] 起動時クリーンアップ失敗",

  // Webサーバー
  // 起動/例外処理
  // web.auth_* は API ミドルウェアの認証分岐と対応付ける
  "web.server_started": "[Webサーバー] 起動 URL: {{url}}",
  "web.startup_error": "[Webサーバー] 起動エラー:",
  "web.unhandled_rejection": "[Webサーバー] 未処理のPromise拒否:",
  "web.uncaught_exception": "[Webサーバー] 未処理の例外:",
  "web.startup_failed": "[Webサーバー] 起動失敗:",
  "web.api_error": "[Webサーバー] APIエラー:",
  "web.internal_server_error": "[Webサーバー] 内部サーバーエラー",
  // API認証（Bearer API Key）
  // 認証結果ログとAPI応答文言
  "web.auth_unauthorized":
    "[Webサーバー] [Auth] 未認証リクエスト Method: {{method}} URL: {{url}}",
  "web.auth_invalid_token":
    "[Webサーバー] [Auth] 無効なトークン Method: {{method}} URL: {{url}}",
  "web.auth_unauthorized_error": "Unauthorized",
  "web.auth_forbidden_error": "Forbidden",
  // Authorization ヘッダー不足/不正時の利用者向けガイダンス
  "web.auth_header_required":
    "Authorization: Bearer <api-key> ヘッダーが必要です",
  "web.auth_invalid_token_message": "無効なトークンです",

  // Discord エラー通知
  "discord.error_notification_title": "🚨 {{appName}} エラー通知",
} as const;

export type SystemTranslations = typeof system;
