// src/bot/features/sticky-message/handlers/stickyMessageCreateHandler.ts
// スティッキーメッセージ messageCreate イベントハンドラー

import { ChannelType, type Message } from "discord.js";
import { logger } from "../../../../shared/utils/logger";
import { getBotStickyMessageResendService } from "../../../services/botStickyMessageDependencyResolver";

/**
 * messageCreate イベントでスティッキーメッセージを処理する
 * Bot 自身の投稿は無視し、テキストチャンネルのみ処理する
 */
export async function handleStickyMessageCreate(
  message: Message,
): Promise<void> {
  // Bot 自身のメッセージは無視（無限ループ防止）
  if (message.author.bot) return;
  // ギルド外は対象外
  if (!message.guildId) return;

  // テキストチャンネル以外は対象外
  if (message.channel.type !== ChannelType.GuildText) return;

  try {
    const service = getBotStickyMessageResendService();
    await service.handleMessageCreate(message.channel, message.guildId);
  } catch (err) {
    logger.error("StickyMessage handleMessageCreate error", {
      channelId: message.channelId,
      guildId: message.guildId,
      err,
    });
  }
}
