// src/shared/locale/locales/en/resources.ts
// English translation resources export

import { commands } from "./commands";
import { common } from "./common";
import { errors } from "./errors";
import { events } from "./events";
import { system } from "./system";

export const en = {
  common,
  commands,
  errors,
  events,
  system,
} as const;

export type EnglishTranslations = typeof en;
