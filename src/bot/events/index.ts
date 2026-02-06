// src/bot/events/index.ts
// イベント一覧をエクスポート

import { interactionCreateEvent } from "./interactionCreate";
import { readyEvent } from "./ready";

export const events = [interactionCreateEvent, readyEvent] as const;
