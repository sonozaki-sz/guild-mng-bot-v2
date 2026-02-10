// src/shared/locale/index.ts
// ロケール関連のエクスポート

export {
  addResources,
  changeLanguage,
  DEFAULT_LOCALE,
  t as i18nT,
  initI18n,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./i18n";
export { localeManager, LocaleManager, t, tDefault } from "./LocaleManager";
export { resources } from "./locales";
