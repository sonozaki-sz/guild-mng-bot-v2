// src/bot/events/messageCreate.ts
// メッセージ作成イベント - Bump検知用

import { Events } from "discord.js";
import type { BotEvent } from "../../bot/types/discord";
import { handleBumpMessageCreate } from "../features/bump-reminder/bumpMessageCreateHandler";

export const messageCreateEvent: BotEvent<typeof Events.MessageCreate> = {
  name: Events.MessageCreate,
  // すべての新規メッセージで評価
  once: false,

  async execute(message) {
    // Bump検知ロジックは機能ハンドラへ委譲
    await handleBumpMessageCreate(message);
  },
};
