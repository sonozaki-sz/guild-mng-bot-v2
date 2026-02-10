// src/bot/events/index.ts
// イベント一覧をエクスポート

import { clientReadyEvent } from "./clientReady";
import { interactionCreateEvent } from "./interactionCreate";

export const events = [interactionCreateEvent, clientReadyEvent] as const;
