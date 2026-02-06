// src/shared/locale/LocaleManager.ts
// Guild別言語対応
// REFACTORING_PLAN.md Phase 3.3 準拠

import { Catalog } from "@hi18n/core";
import { IGuildConfigRepository } from "../database/repositories/GuildConfigRepository";
import { logger } from "../utils/logger";

/**
 * ロケールマネージャー
 * Guild別に動的に言語を切り替える
 */
export class LocaleManager {
  private catalogs: Map<string, Catalog<any>> = new Map();
  private defaultLocale: string;
  private repository?: IGuildConfigRepository;

  constructor(defaultLocale: string = "ja") {
    this.defaultLocale = defaultLocale;
  }

  /**
   * Repositoryを設定（DIパターン）
   */
  setRepository(repository: IGuildConfigRepository): void {
    this.repository = repository;
  }

  /**
   * カタログを登録
   */
  registerCatalog(locale: string, catalog: Catalog<any>): void {
    this.catalogs.set(locale, catalog);
    logger.info(`Registered locale catalog: ${locale}`);
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
      // Guild IDが指定されている場合、Guild設定から言語を取得
      let locale = this.defaultLocale;

      if (guildId && this.repository) {
        const guildLocale = await this.repository.getLocale(guildId);
        locale = guildLocale || this.defaultLocale;
      }

      // カタログから翻訳を取得
      const catalog =
        this.catalogs.get(locale) || this.catalogs.get(this.defaultLocale);

      if (!catalog) {
        logger.warn(`No catalog found for locale: ${locale}`);
        return key;
      }

      // @hi18n/coreの翻訳メソッドを呼び出す
      // @hi18n/coreのCatalogは getMessage や他のメソッドを使用する可能性があります
      // 一時的に any として扱います
      return (catalog as any).t?.(key, params) || (catalog as any)[key] || key;
    } catch (error) {
      logger.error(`Translation failed for key: ${key}`, error);
      return key;
    }
  }

  /**
   * デフォルト言語を取得
   */
  getDefaultLocale(): string {
    return this.defaultLocale;
  }

  /**
   * 対応言語一覧を取得
   */
  getSupportedLocales(): string[] {
    return Array.from(this.catalogs.keys());
  }

  /**
   * 言語が対応しているか確認
   */
  isSupported(locale: string): boolean {
    return this.catalogs.has(locale);
  }
}

// シングルトンインスタンス
export const localeManager = new LocaleManager("ja");

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
  const catalog = localeManager["catalogs"].get(
    localeManager.getDefaultLocale(),
  );
  if (!catalog) return key;
  return (catalog as any).t?.(key, params) || (catalog as any)[key] || key;
};
