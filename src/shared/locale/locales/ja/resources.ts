// src/shared/locale/locales/ja/resources.ts
// 日本語翻訳リソースのエクスポート

import { commands } from "./commands";
import { common } from "./common";
import { errors } from "./errors";
import { events } from "./events";
import { system } from "./system";

export const ja = {
  common,
  commands,
  errors,
  events,
  system,
} as const;

export type JapaneseTranslations = typeof ja;
