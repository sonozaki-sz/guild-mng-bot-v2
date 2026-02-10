// src/shared/locale/commandLocalizations.ts
// コマンド定義用のローカライゼーションヘルパー

import { LocalizationMap } from "discord.js";
import { resources } from "./locales";

/**
 * コマンド説明文のローカライゼーションを取得
 * @param key 翻訳キー（例: "ping.description"）
 * @returns Discord APIのLocalizationMap形式
 */
export function getCommandLocalizations(
  key: keyof typeof resources.ja.commands,
): {
  ja: string;
  localizations: LocalizationMap;
} {
  return {
    ja: resources.ja.commands[key],
    localizations: {
      "en-US": resources.en.commands[key],
      "en-GB": resources.en.commands[key],
    },
  };
}

/**
 * コマンド説明文とローカライゼーションを一度に設定するヘルパー
 * @param key 翻訳キー
 * @example
 * .setName("ping")
 * ...withLocalization("ping.description")
 */
export function withLocalization(key: keyof typeof resources.ja.commands) {
  const { ja, localizations } = getCommandLocalizations(key);
  return {
    description: ja,
    descriptionLocalizations: localizations,
    /**
     * SlashCommandBuilderなどに適用
     */
    apply: <
      T extends {
        setDescription: (desc: string) => T;
        setDescriptionLocalizations: (loc: LocalizationMap) => T;
      },
    >(
      builder: T,
    ): T => {
      return builder
        .setDescription(ja)
        .setDescriptionLocalizations(localizations);
    },
  };
}
