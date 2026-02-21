// src/bot/utils/messageResponse.ts
// Discord向けステータスEmbed生成ユーティリティ

import { EmbedBuilder } from "discord.js";
import { tDefault } from "../../shared/locale/localeManager";

export type MessageStatus = "success" | "info" | "warning" | "error";

const STATUS_COLORS: Record<MessageStatus, number> = {
  success: 0x57f287,
  info: 0x3498db,
  warning: 0xfee75c,
  error: 0xed4245,
};

const STATUS_EMOJIS: Record<MessageStatus, string> = {
  success: "✅",
  info: "ℹ️",
  warning: "⚠️",
  error: "❌",
};

export interface EmbedOptions {
  title?: string;
  timestamp?: boolean;
  fields?: { name: string; value: string; inline?: boolean }[];
}

/**
 * ステータス種別に応じた共通Embedを生成する
 * @param status 表示ステータス
 * @param title Embedタイトル
 * @param description Embed本文
 * @param options 追加オプション
 * @returns 生成したEmbed
 */
export function createStatusEmbed(
  status: MessageStatus,
  title: string,
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  const emoji = STATUS_EMOJIS[status];
  const color = STATUS_COLORS[status];
  const maxTitleLength = 250;
  const truncatedTitle =
    title.length > maxTitleLength
      ? title.substring(0, maxTitleLength) + "..."
      : title;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${truncatedTitle}`);

  if (description) {
    embed.setDescription(description);
  }

  if (options?.timestamp) {
    embed.setTimestamp();
  }

  if (options?.fields) {
    embed.addFields(options.fields);
  }

  return embed;
}

/**
 * 成功ステータスEmbedを生成する
 * @param description Embed本文
 * @param options 追加オプション
 * @returns 生成したEmbed
 */
export function createSuccessEmbed(
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  return createStatusEmbed(
    "success",
    options?.title ?? tDefault("common:success"),
    description,
    options,
  );
}

/**
 * 情報ステータスEmbedを生成する
 * @param description Embed本文
 * @param options 追加オプション
 * @returns 生成したEmbed
 */
export function createInfoEmbed(
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  return createStatusEmbed(
    "info",
    options?.title ?? tDefault("common:info"),
    description,
    options,
  );
}

/**
 * 警告ステータスEmbedを生成する
 * @param description Embed本文
 * @param options 追加オプション
 * @returns 生成したEmbed
 */
export function createWarningEmbed(
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  return createStatusEmbed(
    "warning",
    options?.title ?? tDefault("common:warning"),
    description,
    options,
  );
}

/**
 * エラーステータスEmbedを生成する
 * @param description Embed本文
 * @param options 追加オプション
 * @returns 生成したEmbed
 */
export function createErrorEmbed(
  description: string,
  options?: EmbedOptions,
): EmbedBuilder {
  return createStatusEmbed(
    "error",
    options?.title ?? tDefault("common:error"),
    description,
    options,
  );
}
