// src/shared/locale/locales/ja/common.ts
// 共通の翻訳リソース

export const common = {
  // 基本
  success: "成功",
  error: "エラー",
  warning: "警告",
  info: "情報",

  // 状態
  enabled: "有効",
  disabled: "無効",
  loading: "読み込み中",
  processing: "処理中",

  // アクション
  cancel: "キャンセル",
  confirm: "確認",
  delete: "削除",
  edit: "編集",
  save: "保存",

  // その他
  unknown: "不明",
  none: "なし",
  all: "すべて",
} as const;

export type CommonTranslations = typeof common;
