// src/bot/events/channelDelete.ts
// チャンネル削除同期イベント（VAC・スティッキーメッセージ）

import { Events } from "discord.js";
import { handleStickyMessageChannelDelete } from "../features/sticky-message/handlers/stickyMessageChannelDeleteHandler";
import { handleVacChannelDelete } from "../features/vac/handlers/vacChannelDelete";
import type { BotEvent } from "../types/discord";

export const channelDeleteEvent: BotEvent<typeof Events.ChannelDelete> = {
  name: Events.ChannelDelete,
  // チャンネル削除のたびに同期処理を実行
  once: false,

  /**
   * channelDelete イベント発火時に VAC・スティッキーメッセージの同期処理を実行する
   * @param channel 削除されたチャンネル
   * @returns 実行完了を示す Promise
   */
  async execute(channel) {
    // VAC関連の整合性調整は機能ハンドラへ委譲
    await handleVacChannelDelete(channel);
    // スティッキーメッセージのDBレコード・タイマーを破棄
    await handleStickyMessageChannelDelete(channel);
  },
};
