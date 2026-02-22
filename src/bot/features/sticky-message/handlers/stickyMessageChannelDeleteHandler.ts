// src/bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler.ts
// スティッキーメッセージ channelDelete ハンドラー

import { ChannelType, type Channel } from "discord.js";
import { logger } from "../../../../shared/utils/logger";
import {
  getBotStickyMessageConfigService,
  getBotStickyMessageResendService,
} from "../../../services/botStickyMessageDependencyResolver";

/**
 * channelDelete 時にスティッキーメッセージの DB レコードとタイマーを破棄する
 * テキストチャンネル以外は対象外
 * @param channel 削除されたチャンネル
 */
export async function handleStickyMessageChannelDelete(
  channel: Channel,
): Promise<void> {
  // テキストチャンネル以外はスティッキーメッセージの対象外
  if (channel.type !== ChannelType.GuildText) return;

  const channelId = channel.id;

  // 再送信タイマーが残っていればキャンセルする
  getBotStickyMessageResendService().cancelTimer(channelId);

  // DB にレコードがあれば削除する
  try {
    await getBotStickyMessageConfigService().deleteByChannel(channelId);
    logger.debug("StickyMessage: cleaned up on channel delete", { channelId });
  } catch (err) {
    logger.error("StickyMessage: failed to delete record on channel delete", {
      channelId,
      err,
    });
  }
}
