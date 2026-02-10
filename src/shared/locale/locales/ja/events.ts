// src/shared/locale/locales/ja/events.ts
// イベント関連の翻訳リソース

export const events = {
  // Bot起動
  "ready.logged_in": "{{username}} としてログインしました",
  "ready.commands_registered": "{{count}} 個のコマンドを登録しました",

  // サーバー関連
  "guild.joined": "新しいサーバーに参加しました: {{guildName}}",
  "guild.left": "サーバーから退出しました: {{guildName}}",

  // メンバー関連
  "member.joined": "{{username}} がサーバーに参加しました",
  "member.left": "{{username}} がサーバーから退出しました",
} as const;

export type EventsTranslations = typeof events;
