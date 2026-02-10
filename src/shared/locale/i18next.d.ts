// src/shared/locale/i18next.d.ts
// i18next型定義の拡張

import "i18next";
import type { TranslationResources } from "./locales";

declare module "i18next" {
  interface CustomTypeOptions {
    // デフォルトの名前空間
    defaultNS: "common";

    // リソースの型定義
    resources: TranslationResources["ja"];

    // 翻訳キーの型安全性を有効化
    returnNull: false;
  }
}
