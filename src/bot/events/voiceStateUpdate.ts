// src/bot/events/voiceStateUpdate.ts
// VAC用 voiceStateUpdate イベント

import { Events, type VoiceState } from "discord.js";
import type { BotEvent } from "../../bot/types/discord";
import { handleVacVoiceStateUpdate } from "../features/vac/handlers/vacVoiceState";

export const voiceStateUpdateEvent: BotEvent<typeof Events.VoiceStateUpdate> = {
  name: Events.VoiceStateUpdate,
  // ボイス状態変化ごとに監視
  once: false,

  async execute(oldState: VoiceState, newState: VoiceState) {
    // VAC同期ロジックは専用ハンドラへ委譲
    await handleVacVoiceStateUpdate(oldState, newState);
  },
};
