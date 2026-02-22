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
  "vac.vc-limit.limit.description": "人数制限（0=無制限、最大99）",
  "vac.embed.renamed": "VC名を {{name}} に変更しました",
  "vac.embed.limit_changed": "人数制限を {{limit}} に設定しました",
  // パネル内の AFK 一括移動結果メッセージ
  "vac.embed.members_moved": "{{count}}人を AFK に移動しました",
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
  "vac.panel.afk_button": "メンバーをAFKに移動",
  "vac.panel.refresh_button": "パネルを最下部に移動",

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
  "sticky-message.set.embed-modal.embed-description.label": "説明文",
  "sticky-message.set.embed-modal.embed-description.placeholder":
    "Embed の説明文を入力（最大4096文字）",
  "sticky-message.set.embed-modal.embed-color.label": "カラーコード",
  "sticky-message.set.embed-modal.embed-color.placeholder":
    "#5865F2 または 0x5865F2 形式で入力",
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
