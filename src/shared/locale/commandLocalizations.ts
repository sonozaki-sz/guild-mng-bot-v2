// src/shared/locale/commandLocalizations.ts
// コマンド定義用のローカライゼーションヘルパー

import { resources } from "./locales/resources";

type CommandLocalizationMap = Record<string, string>;

/**
 * コマンド説明文のローカライゼーションを取得
 * @param key 翻訳キー（例: "ping.description"）
 * @returns Discord APIのLocalizationMap形式
 */
export function getCommandLocalizations(
  key: keyof typeof resources.ja.commands,
): {
  ja: string;
  localizations: CommandLocalizationMap;
} {
  // 既定表示は日本語、その他は Discord の locale map で供給
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
  // キーに対応する説明文をまとめて取得して再利用
  const { ja, localizations } = getCommandLocalizations(key);
  return {
    // Discord クライアント既定表示向け（ja）
    description: ja,
    // クライアントロケール別の説明文マップ
    descriptionLocalizations: localizations,
    /**
     * SlashCommandBuilderなどに適用
     */
    apply: <
      T extends {
        setDescription: (desc: string) => T;
        setDescriptionLocalizations: (loc: CommandLocalizationMap) => T;
      },
    >(
      builder: T,
    ): T => {
      // builder への適用順を固定し、戻り値チェーンを維持
      return builder
        .setDescription(ja)
        .setDescriptionLocalizations(localizations);
    },
  };
}
