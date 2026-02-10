// src/shared/locale/locales/ja/errors.ts
// エラーメッセージの翻訳リソース

export const errors = {
  // データベースエラー
  "database.get_config_failed": "設定の取得に失敗しました。",
  "database.save_config_failed": "設定の保存に失敗しました。",
  "database.update_config_failed": "設定の更新に失敗しました。",
  "database.delete_config_failed": "設定の削除に失敗しました。",
  "database.unknown_error": "不明なエラー",

  // バリデーションエラー
  "validation.guild_only": "このコマンドはサーバー内でのみ使用できます。",
  "validation.invalid_subcommand": "無効なサブコマンドです",

  // 権限エラー
  "permission.administrator_required":
    "このコマンドを実行するには管理者権限が必要です。",

  // AFKエラー
  "afk.not_configured":
    "AFKチャンネルが設定されていません。\n`/afk-config set-ch` でチャンネルを設定してください。（管理者用）",
  "afk.member_not_found": "ユーザーが見つかりませんでした。",
  "afk.user_not_in_voice": "指定されたユーザーはボイスチャンネルにいません。",
  "afk.channel_not_found":
    "AFKチャンネルが見つかりませんでした。\nチャンネルが削除されている可能性があります。",
  "afk.invalid_channel_type": "ボイスチャンネルを指定してください。",

  // 一般的なエラー
  "general.unexpected_production":
    "予期しないエラーが発生しました。後ほど再度お試しください。",
  "general.unexpected_with_message": "エラー: {{message}}",
} as const;

export type ErrorsTranslations = typeof errors;
