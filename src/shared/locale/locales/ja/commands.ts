// src/shared/locale/locales/ja/commands.ts
// コマンド関連の翻訳リソース

export const commands = {
  // Example コマンド
  "example.description": "サンプルコマンド",
  "example.success": "コマンドが正常に実行されました！",

  // 共通メッセージ
  "cooldown.message": "このコマンドは {{seconds}} 秒後に再度使用できます。",
  "permission.denied": "このコマンドを実行する権限がありません。",
  "execution.failed": "コマンドの実行に失敗しました。",
} as const;

export type CommandsTranslations = typeof commands;
