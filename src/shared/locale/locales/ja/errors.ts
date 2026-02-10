// src/shared/locale/locales/ja/errors.ts
// エラーメッセージの翻訳リソース

export const errors = {
  // 一般エラー
  unexpected: "予期しないエラーが発生しました。",
  not_found: "見つかりませんでした。",
  invalid_input: "入力内容が無効です。",
  permission_denied: "権限がありません。",

  // データベースエラー
  "database.connection_failed": "データベースへの接続に失敗しました。",
  "database.query_failed": "データベースクエリに失敗しました。",

  // Discord API エラー
  "discord.api_error": "Discord APIでエラーが発生しました。",
  "discord.rate_limit":
    "APIのレート制限に達しました。しばらく待ってから再試行してください。",

  // バリデーションエラー
  "validation.required": "この項目は必須です。",
  "validation.invalid_format": "形式が正しくありません。",
  "validation.out_of_range": "値が範囲外です。",
} as const;

export type ErrorsTranslations = typeof errors;
