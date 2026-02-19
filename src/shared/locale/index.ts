// src/shared/locale/index.ts
// ロケール関連のエクスポート

// SlashCommand 用ローカライズ取得ヘルパー
export { getCommandLocalizations } from "./commandLocalizations";
// i18n 基本定数・型
export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./i18n";
// LocaleManager 本体と翻訳ヘルパー
export {
  LocaleManager,
  localeManager,
  tDefault,
  tGuild,
} from "./localeManager";
// 翻訳リソース定義
export { resources } from "./locales";
