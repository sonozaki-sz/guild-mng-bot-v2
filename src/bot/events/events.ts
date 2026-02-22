// src/bot/events/events.ts
// イベント一覧をエクスポート

import { channelDeleteEvent } from "./channelDelete";
import { clientReadyEvent } from "./clientReady";
import { interactionCreateEvent } from "./interactionCreate";
import { messageCreateEvent } from "./messageCreate";
import { voiceStateUpdateEvent } from "./voiceStateUpdate";

/**
 * Bot が購読するイベント一覧
 * ここへ追加したイベントだけが Discord Client に登録される
 */
export const events = [
  channelDeleteEvent,
  interactionCreateEvent,
  clientReadyEvent,
  messageCreateEvent,
  voiceStateUpdateEvent,
] as const;
