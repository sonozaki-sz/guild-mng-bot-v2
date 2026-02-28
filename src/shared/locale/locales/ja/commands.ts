// src/shared/locale/locales/ja/commands.ts
// コマンド関連の翻訳リソース

export const commands = {
  // Ping コマンド
  "ping.description": "ボットの応答速度を確認。",
  "ping.embed.measuring": "🏓 計測中...",
  "ping.embed.response":
    "📡 API レイテンシー: **{{apiLatency}}ms**\n💓 WebSocket Ping: **{{wsLatency}}ms**",

  // クールダウン
  "cooldown.wait": "⏱️ このコマンドは **{{seconds}}秒後** に使用できます。",

  // AFKコマンド
  "afk.description": "AFKチャンネルにユーザーを移動。",
  "afk.user.description": "移動するユーザー（省略で自分）",
  "afk.embed.moved": "{{user}} を {{channel}} に移動しました",

  // AFK設定コマンド
  "afk-config.description": "AFK機能の設定（管理者専用）",
  "afk-config.set-channel.description": "AFKチャンネルを設定。",
  "afk-config.set-channel.channel.description":
    "AFKチャンネル（ボイスチャンネル）",
  "afk-config.view.description": "現在の設定を表示。",
  "afk-config.embed.title": "AFK機能",
  "afk-config.embed.success_title": "設定完了",
  "afk-config.embed.set_ch_success":
    "AFKチャンネルを {{channel}} に設定しました",
  "afk-config.embed.not_configured": "AFKチャンネルが設定されていません",
  "afk-config.embed.field.channel": "AFKチャンネル",

  // Bumpリマインダー設定コマンド（Discord UIラベル）
  // スラッシュコマンド本体とサブコマンド説明
  "bump-reminder-config.description": "Bumpリマインダーの設定（管理者専用）",
  "bump-reminder-config.enable.description": "Bumpリマインダー機能を有効化",
  "bump-reminder-config.disable.description": "Bumpリマインダー機能を無効化",
  "bump-reminder-config.set-mention.description":
    "メンションロール・ユーザーを設定",
  "bump-reminder-config.set-mention.role.description":
    "リマインダーでメンションするロール",
  "bump-reminder-config.set-mention.user.description":
    "リマインダーでメンションするユーザー（追加・削除切替）",
  "bump-reminder-config.remove-mention.description": "メンション設定を削除",
  "bump-reminder-config.remove-mention.target.description": "削除対象",
  "bump-reminder-config.remove-mention.target.role": "ロール設定",
  "bump-reminder-config.remove-mention.target.user": "ユーザー（選択UI）",
  "bump-reminder-config.remove-mention.target.users": "全ユーザー",
  "bump-reminder-config.remove-mention.target.all": "ロール＋全ユーザー",
  "bump-reminder-config.view.description": "現在の設定を表示",

  // Bumpリマインダー設定コマンド レスポンス
  // 共通状態メッセージ
  // embed.* はコマンド側の成功/失敗ハンドリング順に並べる
  "bump-reminder-config.embed.success_title": "設定完了",
  "bump-reminder-config.embed.not_configured":
    "Bumpリマインダーが設定されていません。",
  "bump-reminder-config.embed.select_users_to_remove":
    "削除するユーザーを選択してください：",
  "bump-reminder-config.embed.enable_success":
    "Bumpリマインダー機能を有効化しました",
  "bump-reminder-config.embed.disable_success":
    "Bumpリマインダー機能を無効化しました",
  // メンション設定（追加/削除/入力不備）
  "bump-reminder-config.embed.set_mention_role_success":
    "メンションロールを {{role}} に設定しました",
  "bump-reminder-config.embed.set_mention_user_added":
    "{{user}} をメンションリストに追加しました",
  "bump-reminder-config.embed.set_mention_user_removed":
    "{{user}} をメンションリストから削除しました",
  "bump-reminder-config.embed.set_mention_error_title": "入力エラー",
  "bump-reminder-config.embed.set_mention_error":
    "ロールまたはユーザーを指定してください",
  "bump-reminder-config.embed.remove_mention_role":
    "メンションロールの登録を削除しました",
  "bump-reminder-config.embed.remove_mention_users":
    "全てのメンションユーザーを削除しました",
  "bump-reminder-config.embed.remove_mention_all":
    "全てのメンション設定を削除しました",
  "bump-reminder-config.embed.remove_mention_select":
    "以下のユーザーをメンションリストから削除しました：\n{{users}}",
  "bump-reminder-config.embed.remove_mention_error_title": "削除エラー",
  "bump-reminder-config.embed.remove_mention_error_no_users":
    "削除するユーザーが登録されていません",
  // view サブコマンド表示用
  "bump-reminder-config.embed.title": "Bumpリマインダー機能",
  "bump-reminder-config.embed.status": "現在の設定状態",
  "bump-reminder-config.embed.field.status": "状態",
  "bump-reminder-config.embed.field.mention_role": "メンションロール",
  "bump-reminder-config.embed.field.mention_users": "メンションユーザー",

  // VAC設定コマンド
  // トリガーVC管理（作成/削除）
  "vac-config.description": "VC自動作成機能の設定（サーバー管理者向け）",
  "vac-config.create-trigger-vc.description": "トリガーチャンネルを作成",
  "vac-config.create-trigger-vc.category.description":
    "作成先カテゴリ（TOP またはカテゴリ。未指定時は実行カテゴリ）",
  "vac-config.remove-trigger-vc.description": "トリガーチャンネルを削除",
  "vac-config.remove-trigger-vc.category.description":
    "削除対象（TOP またはカテゴリ。未指定時は実行カテゴリ）",
  "vac-config.remove-trigger-vc.category.top": "TOP（カテゴリなし）",
  "vac-config.view.description": "現在の設定を表示",
  // view サブコマンド表示用
  "vac-config.embed.title": "VC自動作成機能",
  "vac-config.embed.success_title": "設定完了",
  "vac-config.embed.not_configured": "未設定",
  "vac-config.embed.no_created_vcs": "なし",
  "vac-config.embed.top": "TOP",
  "vac-config.embed.field.trigger_channels": "トリガーチャンネル",
  "vac-config.embed.field.created_vcs": "作成されたVC数",
  "vac-config.embed.field.created_vc_details": "作成されたVC",
  "vac-config.embed.trigger_created":
    "トリガーチャンネル {{channel}} を作成しました",
  "vac-config.embed.trigger_removed":
    "トリガーチャンネル {{channel}} を削除しました",
  "vac-config.embed.remove_error_title": "削除エラー",

  // VAC操作コマンド
  // VC操作（リネーム/人数上限）
  // `vac.panel.*` はボタン customId の表示順に合わせる
  "vac.description": "自動作成VCの設定を変更",
  "vac.vc-rename.description": "参加中のVC名を変更",
  "vac.vc-rename.name.description": "新しいVC名",
  "vac.vc-limit.description": "参加中VCの人数制限を変更",
  "vac.vc-limit.limit.description": "人数制限（0=無制限、0~99）",
  "vac.embed.renamed": "VC名を {{name}} に変更しました",
  "vac.embed.limit_changed": "人数制限を {{limit}} に設定しました",
  // パネル内の AFK 一括移動結果メッセージ
  "vac.embed.members_moved": "{{channel}} へ移動しました。",
  // パネル再送時（最下部移動）の成功メッセージ
  "vac.embed.panel_refreshed": "パネルを最下部に移動しました",
  // 0人制限を表示する際の共通ラベル
  "vac.embed.unlimited": "無制限",
  // 操作パネル UI 文言
  "vac.panel.title": "ボイスチャンネル操作パネル",
  // パネル導入説明（Embed本文）
  "vac.panel.description": "このパネルからVCの設定を変更できます。",
  // ボタンは command handler の customId と対応づく
  "vac.panel.rename_button": "VC名を変更",
  "vac.panel.limit_button": "人数制限を変更",
  "vac.panel.limit_input_placeholder": "0〜99（0: 無制限）",
  "vac.panel.afk_button": "メンバーをAFKに移動",
  "vac.panel.refresh_button": "パネルを最下部に移動",

  // メッセージ削除コマンド
  "message-delete.description":
    "メッセージを一括削除します（デフォルト: サーバー全チャンネル）",
  "message-delete.count.description":
    "削除するメッセージ数（未指定で全件削除）",
  "message-delete.user.description":
    "削除対象のユーザーID またはメンション（Bot/Webhookの場合はIDを直接入力）",
  "message-delete.errors.user_invalid_format":
    "`user` の形式が不正です。ユーザーIDまたはメンション（例: `<@123456789>`）を入力してください。",
  "message-delete.bot.description":
    "ボット・webhookのメッセージのみ削除（true を指定）",
  "message-delete.keyword.description":
    "本文に指定キーワードを含むメッセージのみ削除（部分一致）",
  "message-delete.days.description":
    "過去N日以内のメッセージのみ削除（after/beforeとの同時指定不可）",
  "message-delete.after.description":
    "この日時以降のメッセージのみ削除 (YYYY-MM-DD または YYYY-MM-DDTHH:MM:SS)",
  "message-delete.before.description":
    "この日時以前のメッセージのみ削除 (YYYY-MM-DD または YYYY-MM-DDTHH:MM:SS)",
  "message-delete.channel.description":
    "削除対象を絞り込むチャンネル（未指定でサーバー全体）",

  // message-delete-config コマンド
  "message-delete-config.description": "/message-delete の挙動設定を変更",
  "message-delete-config.confirm.description":
    "削除前に確認ダイアログを表示するか（true:有効 / false:スキップ）",
  // message-delete 設定更新結果
  "message-delete-config.result.confirm_on": "実行確認ダイアログ: 有効",
  "message-delete-config.result.confirm_off": "実行確認ダイアログ: 無効",
  "message-delete-config.result.updated":
    "✅ 設定を更新しました。次回の `/message-delete` から反映されます。\n{{status}}",

  // message-delete バリデーションエラー
  "message-delete.errors.no_filter":
    "フィルタ条件が指定されていないため実行できません。\n`count`・`user`・`bot`・`keyword`・`days`・`after`・`before` のいずれか1つを指定してください。",
  "message-delete.errors.no_channel_no_count":
    "サーバー全体を対象にする場合は `count`（件数）を必ず指定してください。\n特定チャンネルのみ対象にする場合は `channel` を指定してください。",
  "message-delete.confirm.condition_bot": "  ボット/Webhook: 対象",
  "message-delete.errors.days_and_date_conflict":
    "`days` と `after`/`before` は同時に指定できません。どちらか一方を使用してください。",
  "message-delete.errors.after_invalid_format":
    "`after` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
  "message-delete.errors.before_invalid_format":
    "`before` の日付形式が不正です。`YYYY-MM-DD` または `YYYY-MM-DDTHH:MM:SS` 形式で指定してください。",
  "message-delete.errors.date_range_invalid":
    "`after` は `before` より前の日時を指定してください。",
  "message-delete.errors.no_permission":
    "この操作を実行する権限がありません。\n必要な権限: メッセージ管理",
  "message-delete.errors.text_channel_only":
    "テキストチャンネルを指定してください。",
  "message-delete.errors.no_messages_found":
    "削除可能なメッセージが見つかりませんでした。",
  "message-delete.errors.delete_failed":
    "メッセージの削除中にエラーが発生しました。",
  "message-delete.errors.not_authorized": "操作権限がありません。",
  "message-delete.errors.days_invalid_value":
    "日数は1以上の整数で入力してください。",
  // 確認ダイアログ
  "message-delete.confirm.channel_all": "サーバー全体",
  "message-delete.confirm.target_channel": "対象チャンネル: {{channel}}",
  "message-delete.confirm.conditions": "削除条件:",
  "message-delete.confirm.condition_user": "  ユーザー    : <@{{userId}}>",
  "message-delete.confirm.condition_keyword": '  キーワード  : "{{keyword}}"',
  "message-delete.confirm.condition_days": "  期間        : 過去{{days}}日間",
  "message-delete.confirm.condition_after": "  after       : {{after}}",
  "message-delete.confirm.condition_before": "  before      : {{before}}",
  "message-delete.confirm.condition_count": "  件数上限    : {{count}}件",
  "message-delete.confirm.question":
    "⚠️ **この操作は取り消せません**\n\n{{conditions}}\n\n実行しますか？",
  "message-delete.confirm.btn_yes": "削除する",
  "message-delete.confirm.btn_no": "キャンセル",
  "message-delete.confirm.btn_skip_toggle_off": "次回から確認しない",
  "message-delete.confirm.btn_skip_toggle_on": "次回から確認しない",
  "message-delete.confirm.cancelled": "削除をキャンセルしました。",
  "message-delete.confirm.timed_out":
    "タイムアウトしました。再度コマンドを実行してください。",
  // 結果表示
  "message-delete.result.empty_content": "*(本文なし)*",
  // サマリーEmbed
  "message-delete.embed.summary_title": "✅ 削除完了",
  "message-delete.embed.total_deleted": "合計削除件数",
  "message-delete.embed.channel_breakdown": "チャンネル別内訳",
  "message-delete.embed.channel_breakdown_item": "#{{channel}}: {{count}}件",
  "message-delete.embed.breakdown_empty": "—",
  // 詳細Embed
  "message-delete.embed.detail_title":
    "📋 削除したメッセージ一覧  ({{page}} / {{total}} ページ)",
  "message-delete.embed.filter_active": "（フィルター適用中）",
  "message-delete.embed.no_messages": "表示できるメッセージがありません。",
  // ページネーション
  "message-delete.pagination.btn_prev": "前へ",
  "message-delete.pagination.btn_next": "次へ",
  "message-delete.pagination.btn_days_set": "過去{{days}}日間",
  "message-delete.pagination.btn_days_empty": "過去N日間を入力",
  "message-delete.pagination.btn_after_set": "after: {{date}}",
  "message-delete.pagination.btn_after_empty": "after（開始日時）を入力",
  "message-delete.pagination.btn_before_set": "before: {{date}}",
  "message-delete.pagination.btn_before_empty": "before（終了日時）を入力",
  "message-delete.pagination.btn_keyword": "内容で検索",
  "message-delete.pagination.btn_reset": "リセット",
  "message-delete.pagination.author_select_placeholder": "投稿者でフィルター",
  "message-delete.pagination.author_all": "（全投稿者）",
  // モーダル
  "message-delete.modal.keyword.title": "内容でフィルター",
  "message-delete.modal.keyword.label": "キーワード",
  "message-delete.modal.keyword.placeholder": "フィルターするキーワードを入力",
  "message-delete.modal.days.title": "過去N日間でフィルター",
  "message-delete.modal.days.label": "日数（1以上の整数）",
  "message-delete.modal.days.placeholder": "例: 7",
  "message-delete.modal.after.title": "after（開始日時）でフィルター",
  "message-delete.modal.after.label": "開始日時",
  "message-delete.modal.after.placeholder":
    "例: 2026-01-01 または 2026-01-01T00:00:00",
  "message-delete.modal.before.title": "before（終了日時）でフィルター",
  "message-delete.modal.before.label": "終了日時",
  "message-delete.modal.before.placeholder":
    "例: 2026-02-28 または 2026-02-28T23:59:59",

  // メンバーログ設定コマンド
  // スラッシュコマンド本体とサブコマンド説明
  "member-log-config.description": "メンバーログ機能の設定（管理者専用）",
  "member-log-config.set-channel.description": "通知チャンネルを設定",
  "member-log-config.set-channel.channel.description":
    "通知を送信するテキストチャンネル",
  "member-log-config.enable.description": "メンバーログ機能を有効化",
  "member-log-config.disable.description": "メンバーログ機能を無効化",
  "member-log-config.set-join-message.description":
    "カスタム参加メッセージを設定",
  "member-log-config.set-join-message.message.description":
    "参加メッセージ（{user}, {username}, {count} を使用可）",
  "member-log-config.set-leave-message.description":
    "カスタム退出メッセージを設定",
  "member-log-config.set-leave-message.message.description":
    "退出メッセージ（{user}, {username}, {count} を使用可）",
  "member-log-config.view.description": "現在の設定を表示",
  // メンバーログ設定コマンド レスポンス
  "member-log-config.embed.success_title": "設定完了",
  "member-log-config.embed.title": "メンバーログ機能",
  "member-log-config.embed.not_configured":
    "メンバーログが設定されていません。",
  "member-log-config.embed.set_channel_success":
    "通知チャンネルを {{channel}} に設定しました",
  "member-log-config.embed.enable_success": "メンバーログ機能を有効化しました",
  "member-log-config.embed.enable_error_no_channel":
    "通知チャンネルが設定されていません。先に /member-log-config set-channel を実行してください。",
  "member-log-config.embed.disable_success": "メンバーログ機能を無効化しました",
  "member-log-config.embed.set_join_message_success":
    "参加メッセージを設定しました",
  "member-log-config.embed.set_leave_message_success":
    "退出メッセージを設定しました",
  "member-log-config.embed.field.status": "状態",
  "member-log-config.embed.field.channel": "通知チャンネル",
  "member-log-config.embed.field.join_message": "参加メッセージ",
  "member-log-config.embed.field.leave_message": "退出メッセージ",
  // エラー
  "member-log-config.errors.text_channel_only":
    "テキストチャンネルを指定してください。",

  // スティッキーメッセージコマンド
  "sticky-message.description":
    "スティッキーメッセージ（チャンネル最下部固定）の管理（チャンネル管理者専用）",
  // set サブコマンド（プレーンテキスト or Embed モーダル入力）
  "sticky-message.set.description":
    "スティッキーメッセージを設定（モーダル入力）",
  "sticky-message.set.channel.description":
    "設定するテキストチャンネル（省略時はこのチャンネル）",
  "sticky-message.set.embed.description":
    "Embed形式で設定するか（true: Embdedフォーム / false: テキストフォーム）",
  // set プレーンテキストモーダル
  "sticky-message.set.modal.title": "スティッキーメッセージの内容を入力",
  "sticky-message.set.modal.message.label": "メッセージ内容",
  "sticky-message.set.modal.message.placeholder":
    "改行して複数行のメッセージを入力できます（最大2000文字）",
  // set Embed モーダル
  "sticky-message.set.embed-modal.title": "Embed スティッキーメッセージを設定",
  "sticky-message.set.embed-modal.embed-title.label": "タイトル",
  "sticky-message.set.embed-modal.embed-title.placeholder":
    "Embed のタイトルを入力（最大256文字）",
  "sticky-message.set.embed-modal.embed-description.label": "内容",
  "sticky-message.set.embed-modal.embed-description.placeholder":
    "Embed の内容を入力（最大4096文字）",
  "sticky-message.set.embed-modal.embed-color.label": "カラーコード(任意)",
  "sticky-message.set.embed-modal.embed-color.placeholder":
    "#008969 または 0x008969 形式で入力（省略時: #008969）",
  "sticky-message.set.success.title": "設定完了",
  "sticky-message.set.success.description":
    "スティッキーメッセージを設定しました。",
  "sticky-message.set.alreadyExists.title": "警告",
  "sticky-message.set.alreadyExists.description":
    "既にスティッキーメッセージが設定されています。削除してから再度設定してください。",
  // remove サブコマンド
  "sticky-message.remove.description": "スティッキーメッセージを削除",
  "sticky-message.remove.channel.description":
    "スティッキーメッセージを削除するテキストチャンネル",
  "sticky-message.remove.success.title": "削除完了",
  "sticky-message.remove.success.description":
    "スティッキーメッセージを削除しました。",
  "sticky-message.remove.notFound.title": "未設定",
  "sticky-message.remove.notFound.description":
    "このチャンネルにはスティッキーメッセージが設定されていません。",

  // エラー
  "sticky-message.errors.permissionDenied":
    "この操作を実行する権限がありません。チャンネル管理権限が必要です。",
  "sticky-message.errors.emptyMessage": "メッセージ内容を入力してください。",
  "sticky-message.errors.text_channel_only":
    "テキストチャンネルにのみ設定できます。",
  "sticky-message.errors.failed":
    "スティッキーメッセージの操作中にエラーが発生しました。",
  // view サブコマンド
  "sticky-message.view.description":
    "スティッキーメッセージ設定を確認（チャンネル選択UI）",
  "sticky-message.view.title": "スティッキーメッセージ設定",
  "sticky-message.view.select.placeholder": "チャンネルを選択してください",
  "sticky-message.view.notFound.title": "未設定",
  "sticky-message.view.empty":
    "スティッキーメッセージが設定されているチャンネルがありません。",
  "sticky-message.view.field.channel": "チャンネル",
  "sticky-message.view.field.format": "形式",
  "sticky-message.view.field.format_plain": "プレーンテキスト",
  "sticky-message.view.field.format_embed": "Embed",
  "sticky-message.view.field.updated_at": "最終更新",
  "sticky-message.view.field.updated_by": "設定者",
  "sticky-message.view.field.content": "メッセージ内容",
  "sticky-message.view.field.embed_title": "Embedタイトル",
  "sticky-message.view.field.embed_color": "Embedカラー",
  // update サブコマンド
  "sticky-message.update.description":
    "スティッキーメッセージの内容を更新（モーダル入力）",
  "sticky-message.update.channel.description":
    "更新対象のチャンネル（省略時はこのチャンネル）",
  "sticky-message.update.embed.description":
    "Embed形式に更新するか（true: Embed入力フォーム / false: テキスト入力フォーム）",
  // update プレーンテキストモーダル
  "sticky-message.update.modal.title": "スティッキーメッセージを更新",
  "sticky-message.update.modal.message.label": "メッセージ内容",
  "sticky-message.update.modal.message.placeholder":
    "改行して複数行入力できます（最大2000文字）",
  // update Embed モーダル
  "sticky-message.update.embed-modal.title":
    "Embed スティッキーメッセージを更新",
  "sticky-message.update.success.title": "更新完了",
  "sticky-message.update.success.description":
    "スティッキーメッセージを更新しました。",
  "sticky-message.update.notFound.title": "未設定",
} as const;

export type CommandsTranslations = typeof commands;
