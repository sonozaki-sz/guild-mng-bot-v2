// src/shared/locale/helpers.ts
// ローカライゼーション関連のヘルパー関数

import { type ParseKeys } from "i18next";
import { type AllNamespaces, type SupportedLocale } from "./i18n";

/** 全ネームスペースの翻訳キーを受け取るギルド用翻訳関数型 */
export type GuildTFunction = (
  key: ParseKeys<AllNamespaces>,
  options?: Record<string, unknown>,
) => string;

/**
 * ギルド用の翻訳関数を取得
 * LocaleManager 経由でキャッシュを利用するため、直接 DB クエリを発行しない
 * @param guildId ギルドID
 * @returns 翻訳関数
 */
export async function getGuildTranslator(
  guildId: string,
): Promise<GuildTFunction> {
  // 循環依存を避けるため遅延 import で localeManager を取得
  const { localeManager } = await import("./localeManager");
  // guildId に対応する固定 translator（ロケール解決済み）を取得
  const fixedT = await localeManager.getGuildT(guildId);
  // i18next 側の型より実運用側（全NSキー許容）が広いため型を合わせる
  return fixedT as unknown as GuildTFunction;
}

/**
 * ギルドのロケールを取得して LocaleManager キャッシュを更新させる
 * ロケール設定変更後に呼び出すことでキャッシュを無効化する
 */
export async function invalidateGuildLocaleCache(
  guildId: string,
): Promise<void> {
  // 循環依存を避けるため localeManager を遅延 import
  const { localeManager } = await import("./localeManager");
  // 対象 guild のロケールキャッシュだけを破棄（他ギルドへ影響させない）
  localeManager.invalidateLocaleCache(guildId);
}

export type { SupportedLocale };
