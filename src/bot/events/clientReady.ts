// src/bot/events/clientReady.ts
// Bot起動完了イベント

import { Events } from "discord.js";
import type { BotEvent } from "../../bot/types/discord";
import type { BotClient } from "../client";
import { handleClientReady } from "../handlers/clientReadyHandler";

export const clientReadyEvent: BotEvent<typeof Events.ClientReady> = {
  name: Events.ClientReady,
  // 起動時に1回だけ実行
  once: true,

  async execute(client) {
    // 実処理は専用ハンドラへ委譲
    await handleClientReady(client as BotClient);
  },
};
