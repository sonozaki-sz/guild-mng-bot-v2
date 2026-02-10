// src/shared/locale/i18n.ts
// i18next設定ファイル

import type { i18n as I18nInstance } from "i18next";
import i18next from "i18next";

/**
 * サポートする言語
 */
export const SUPPORTED_LOCALES = ["ja", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * デフォルト言語
 */
export const DEFAULT_LOCALE: SupportedLocale = "ja";

/**
 * i18nextインスタンスの初期化
 */
export const initI18n = async (): Promise<I18nInstance> => {
  await i18next.init({
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    debug: process.env.NODE_ENV === "development",

    // リソースをコード内で直接管理（ファイルシステム不要）
    resources: {},

    interpolation: {
      escapeValue: false, // Reactなどで不要なエスケープを無効化
    },

    // 名前空間設定
    ns: ["common", "commands", "errors", "events", "system"],
    defaultNS: "common",
  });

  return i18next;
};

/**
 * 翻訳リソースを追加
 */
export const addResources = (
  locale: SupportedLocale,
  namespace: string,
  resources: Record<string, string>,
): void => {
  i18next.addResourceBundle(locale, namespace, resources, true, true);
};

/**
 * 言語を切り替え
 */
export const changeLanguage = async (
  locale: SupportedLocale,
): Promise<void> => {
  await i18next.changeLanguage(locale);
};

/**
 * 翻訳関数のエクスポート
 */
export const t = i18next.t.bind(i18next);

export default i18next;
