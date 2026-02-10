// src/shared/locale/LocaleManager.ts
// Guild別言語対応（i18next版）

import i18next, { TFunction } from "i18next";
import type { IGuildConfigRepository } from "../database/repositories/GuildConfigRepository";
import { logger } from "../utils/logger";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./i18n";
import { resources } from "./locales";

/**
 * ロケールマネージャー
 * Guild別に動的に言語を切り替える
 */
export class LocaleManager {
  private defaultLocale: SupportedLocale;
  private repository?: IGuildConfigRepository;
  private initialized = false;

  constructor(defaultLocale: SupportedLocale = DEFAULT_LOCALE) {
    this.defaultLocale = defaultLocale;
  }

  /**
   * i18nextを初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await i18next.init({
      lng: this.defaultLocale,
      fallbackLng: this.defaultLocale,
      debug: process.env.NODE_ENV === "development",

      resources: {
        ja: resources.ja,
        en: resources.en,
      },

      interpolation: {
        escapeValue: false,
      },

      ns: ["common", "commands", "errors", "events", "system"],
      defaultNS: "common",
    });

    this.initialized = true;
    logger.info("LocaleManager initialized with i18next");
  }

  /**
   * Repositoryを設定（DIパターン）
   */
  setRepository(repository: IGuildConfigRepository): void {
    this.repository = repository;
  }

  /**
   * Guild別の翻訳文字列を取得
   */
  async translate(
    guildId: string | undefined,
    key: string,
    params?: Record<string, any>,
  ): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Guild IDが指定されている場合、Guild設定から言語を取得
      let locale: SupportedLocale = this.defaultLocale;

      if (guildId && this.repository) {
        const guildLocale = await this.repository.getLocale(guildId);
        if (guildLocale && this.isSupported(guildLocale)) {
          locale = guildLocale as SupportedLocale;
        }
      }

      // i18nextで翻訳
      const options = params ? { lng: locale, ...params } : { lng: locale };
      return i18next.t(key as any, options);
    } catch (error) {
      logger.error(`Translation failed for key: ${key}`, error);
      return key;
    }
  }

  /**
   * 翻訳関数を取得（特定の言語用）
   */
  getFixedT(locale: SupportedLocale): TFunction {
    return i18next.getFixedT(locale);
  }

  /**
   * Guild別の翻訳関数を取得
   */
  async getGuildT(guildId: string | undefined): Promise<TFunction> {
    let locale: SupportedLocale = this.defaultLocale;

    if (guildId && this.repository) {
      const guildLocale = await this.repository.getLocale(guildId);
      if (guildLocale && this.isSupported(guildLocale)) {
        locale = guildLocale as SupportedLocale;
      }
    }

    return this.getFixedT(locale);
  }

  /**
   * デフォルト言語を取得
   */
  getDefaultLocale(): SupportedLocale {
    return this.defaultLocale;
  }

  /**
   * 対応言語一覧を取得
   */
  getSupportedLocales(): readonly SupportedLocale[] {
    return SUPPORTED_LOCALES;
  }

  /**
   * 言語が対応しているか確認
   */
  isSupported(locale: string): boolean {
    return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
  }
}

// シングルトンインスタンス
export const localeManager = new LocaleManager();

/**
 * ヘルパー関数：Guild別翻訳
 */
export const t = async (
  guildId: string | undefined,
  key: string,
  params?: Record<string, any>,
): Promise<string> => {
  return localeManager.translate(guildId, key, params);
};

/**
 * ヘルパー関数：デフォルト言語で翻訳
 */
export const tDefault = (key: string, params?: Record<string, any>): string => {
  const options = params
    ? { lng: localeManager.getDefaultLocale(), ...params }
    : { lng: localeManager.getDefaultLocale() };
  return i18next.t(key as any, options);
};
