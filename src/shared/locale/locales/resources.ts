// src/shared/locale/locales/resources.ts
// すべての翻訳リソースのエクスポート

import { en } from "./en/resources";
import { ja } from "./ja/resources";

export const resources = {
  ja,
  en,
} as const;

export type TranslationResources = typeof resources;
