// src/shared/locale/locales/ja/events.ts
// イベント関連の翻訳リソース

export const events = {
  // Bot起動
  "ready.bot_ready": "✅ Botの準備が完了しました！ {{tag}} としてログイン",
  "ready.servers": "📊 サーバー数: {{count}}",
  "ready.users": "👥 ユーザー数: {{count}}",
  "ready.commands": "💬 コマンド数: {{count}}",
  "ready.status": "{{count}}個のサーバーで稼働中 | by sonozaki",
  "ready.event_registered": "イベント登録: {{name}}",

  // インタラクション
  "interaction.unknown_command": "不明なコマンド: {{commandName}}",
  "interaction.command_executed":
    "コマンド実行: {{commandName}} (実行者: {{userTag}})",
  "interaction.command_error": "コマンド {{commandName}} の実行エラー:",
  "interaction.autocomplete_error": "{{commandName}} の自動補完エラー:",
  "interaction.unknown_modal": "不明なモーダル: {{customId}}",
  "interaction.modal_submitted":
    "モーダル送信: {{customId}} (送信者: {{userTag}})",
  "interaction.modal_error": "モーダル {{customId}} の実行エラー:",
} as const;

export type EventsTranslations = typeof events;
