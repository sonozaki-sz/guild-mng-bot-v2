// src/bot/utils/messageResponse.ts
// Discord向けステータスEmbed生成ユーティリティ

import { EmbedBuilder } from "discord.js";
import { tDefault } from "../../shared/locale";

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
