// src/bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler.ts
// スティッキーメッセージ channelDelete ハンドラー

import { ChannelType, type Channel } from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
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
    logger.debug(
      tDefault("system:sticky-message.channel_delete_cleanup", { channelId }),
    );
  } catch (err) {
    logger.error(
      tDefault("system:sticky-message.channel_delete_cleanup_failed", {
        channelId,
      }),
      { channelId, err },
    );
  }
}
