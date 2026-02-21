// src/bot/events/events.ts
// イベント一覧をエクスポート

import { channelDeleteEvent } from "./channelDelete";
import { clientReadyEvent } from "./clientReady";
import { interactionCreateEvent } from "./interactionCreate";
import { messageCreateEvent } from "./messageCreate";
import { voiceStateUpdateEvent } from "./voiceStateUpdate";

export const events = [
  channelDeleteEvent,
  interactionCreateEvent,
  clientReadyEvent,
  messageCreateEvent,
  voiceStateUpdateEvent,
] as const;