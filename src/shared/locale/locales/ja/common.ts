// src/shared/locale/locales/ja/common.ts
// 共通の翻訳リソース

export const common = {
  // 状態ラベル
  // メッセージEmbedのタイトル・フィールドで共通利用
  success: "成功",
  info: "情報",
  warning: "警告",
  error: "エラー",
  // 機能設定の ON/OFF 表示
  enabled: "有効",
  disabled: "無効",
  // 未設定/空状態のプレースホルダ
  none: "なし",
} as const;

export type CommonTranslations = typeof common;
