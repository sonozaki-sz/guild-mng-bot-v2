// src/bot/features/sticky-message/services/stickyMessagePayloadBuilder.ts
// スティッキーメッセージ送信ペイロードビルダー

import { EmbedBuilder, type MessageCreateOptions } from "discord.js";
import type { StickyMessage } from "../repositories/types";

/** Embed データの型 */
export interface StickyEmbedData {
  title?: string;
  description?: string;
  color?: number;
}

/**
 * StickyMessage エンティティから Discord 送信ペイロードを生成する
 */
export function buildStickyMessagePayload(
  sticky: StickyMessage,
): MessageCreateOptions {
  if (sticky.embedData) {
    const embed = parseEmbedData(sticky.embedData, sticky.content);
    return { embeds: [embed] };
  }

  return { content: sticky.content };
}

/**
 * JSON 文字列から EmbedBuilder を生成する
 */
function parseEmbedData(
  embedDataJson: string,
  fallbackContent: string,
): EmbedBuilder {
  try {
    const data = JSON.parse(embedDataJson) as StickyEmbedData;
    const embed = new EmbedBuilder().setColor(data.color ?? 0x5865f2);

    if (data.title) embed.setTitle(data.title);
    embed.setDescription(data.description ?? fallbackContent);

    return embed;
  } catch {
    // JSON パース失敗時はプレーンテキストで代用
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setDescription(fallbackContent);
  }
}
