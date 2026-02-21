// src/bot/events/messageCreate.ts
// メッセージ作成イベント - Bump検知用

import { Events } from "discord.js";
import { handleBumpMessageCreate } from "../features/bump-reminder/handlers/bumpMessageCreateHandler";
import type { BotEvent } from "../types/discord";

export const messageCreateEvent: BotEvent<typeof Events.MessageCreate> = {
  name: Events.MessageCreate,
  // すべての新規メッセージで評価
  once: false,

  async execute(message) {
    // Bump検知ロジックは機能ハンドラへ委譲
    await handleBumpMessageCreate(message);
  },
};
