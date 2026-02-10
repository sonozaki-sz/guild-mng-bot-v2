// src/shared/locale/index.ts
// ロケール関連のエクスポート

export { getCommandLocalizations } from "./commandLocalizations";
export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  addResources,
  changeLanguage,
  t as i18nT,
  initI18n,
  type SupportedLocale,
} from "./i18n";
export { LocaleManager, localeManager, t, tDefault } from "./LocaleManager";
export { resources } from "./locales";
