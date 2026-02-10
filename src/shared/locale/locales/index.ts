// src/shared/locale/locales/index.ts
// すべての翻訳リソースのエクスポート

import { en } from "./en";
import { ja } from "./ja";

export const resources = {
  ja,
  en,
} as const;

export type TranslationResources = typeof resources;
