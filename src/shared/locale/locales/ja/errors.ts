// src/shared/locale/locales/ja/errors.ts
// エラーメッセージの翻訳リソース

export const errors = {
  // データベースエラー
  // Repository/Store 層からの失敗をユーザー向け文言に変換
  "database.get_config_failed": "設定の取得に失敗しました。",
  "database.save_config_failed": "設定の保存に失敗しました。",
  "database.update_config_failed": "設定の更新に失敗しました。",
  "database.delete_config_failed": "設定の削除に失敗しました。",
  "database.check_existence_failed": "存在確認に失敗しました。",
  "database.unknown_error": "不明なエラー",

  // バリデーションエラー
  // コマンド入力・実行コンテキストの不正
  "validation.error_title": "バリデーションエラー",
  "validation.guild_only": "このコマンドはサーバー内でのみ使用できます。",
  "validation.invalid_subcommand": "無効なサブコマンドです",

  // 権限エラー
  // 実行ユーザー権限不足
  "permission.manage_guild_required":
    "このコマンドを実行するにはサーバー管理（MANAGE_GUILD）権限が必要です。",

  // インタラクションエラー
  // UI操作（ボタン/セレクト）タイムアウト
  "interaction.timeout": "操作がタイムアウトしました。",

  // AFKエラー
  "afk.not_configured":
    "AFKチャンネルが設定されていません。\n`/afk-config set-channel` でチャンネルを設定してください。（管理者用）",
  "afk.member_not_found": "ユーザーが見つかりませんでした。",
  "afk.user_not_in_voice": "指定されたユーザーはボイスチャンネルにいません。",
  "afk.channel_not_found":
    "AFKチャンネルが見つかりませんでした。\nチャンネルが削除されている可能性があります。",
  "afk.invalid_channel_type": "ボイスチャンネルを指定してください。",

  // VACエラー
  "vac.not_configured": "VC自動作成機能が設定されていません。",
  "vac.trigger_not_found":
    "指定されたカテゴリーにはトリガーチャンネルはありません。",
  "vac.already_exists": "トリガーチャンネルが既に存在します。",
  "vac.category_full": "カテゴリ内のチャンネル数が上限に達しています。",
  "vac.no_permission": "チャンネルを作成または編集する権限がありません。",
  "vac.not_in_vc": "このVCに参加しているユーザーのみ操作できます。",
  "vac.not_in_any_vc": "このコマンドはVC参加中にのみ使用できます。",
  "vac.not_vac_channel": "このVCは自動作成チャンネルではありません。",
  "vac.limit_out_of_range": "人数制限は0〜99の範囲で指定してください。",

  // 一般的なエラー
  // 予期しない例外の最終フォールバック
  "general.error_title": "エラーが発生しました",
  "general.unexpected_production":
    "予期しないエラーが発生しました。後ほど再度お試しください。",
  "general.unexpected_with_message": "エラー: {{message}}",
} as const;

export type ErrorsTranslations = typeof errors;
