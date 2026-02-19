// src/bot/events/index.ts
// イベント一覧をエクスポート

import { channelDeleteEvent } from "./channelDelete";
import { clientReadyEvent } from "./clientReady";
import { interactionCreateEvent } from "./interactionCreate";
import { messageCreateEvent } from "./messageCreate";
import { voiceStateUpdateEvent } from "./voiceStateUpdate";

export const events = [
  // 登録順序を明示し、起動時に一括登録する
  channelDeleteEvent,
  interactionCreateEvent,
  clientReadyEvent,
  messageCreateEvent,
  voiceStateUpdateEvent,
] as const;
