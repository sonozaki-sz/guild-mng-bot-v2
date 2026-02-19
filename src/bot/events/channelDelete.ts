// src/bot/events/channelDelete.ts
// VACのチャンネル削除同期イベント

import { Events } from "discord.js";
import type { BotEvent } from "../../bot/types/discord";
import { handleVacChannelDelete } from "../features/vac/handlers/vacChannelDelete";

export const channelDeleteEvent: BotEvent<typeof Events.ChannelDelete> = {
  name: Events.ChannelDelete,
  // チャンネル削除のたびに同期処理を実行
  once: false,

  async execute(channel) {
    // VAC関連の整合性調整は機能ハンドラへ委譲
    await handleVacChannelDelete(channel);
  },
};
