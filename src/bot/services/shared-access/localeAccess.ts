// src/bot/services/shared-access/localeAccess.ts
// shared locale へのアクセス集約

import {
  getCommandLocalizations,
  localeManager,
  tDefault,
  tGuild,
} from "../../../shared/locale";
import type { GuildTFunction } from "../../../shared/locale/helpers";
import { getGuildTranslator } from "../../../shared/locale/helpers";

export {
  getCommandLocalizations,
  getGuildTranslator,
  localeManager,
  tDefault,
  tGuild,
};
export type { GuildTFunction };
