// src/bot/services/botEventRegistration.ts
// Botイベント登録の責務を集約

import { tDefault } from "../../shared/locale/localeManager";
import { logger } from "../../shared/utils/logger";
import type { BotClient } from "../client";
import { registerBotEvent, type BotEvent } from "../types/discord";

/**
 * Bot が扱うイベント一覧をクライアントへ登録する関数
 */
export function registerBotEvents(
  client: BotClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: readonly BotEvent<any>[],
): void {
  logger.info(
    tDefault("system:bot.events.registering", { count: events.length }),
  );

  // 受け取ったイベント定義を順に Client へ登録
  for (const event of events) {
    registerBotEvent(client, event);
    logger.info(
      tDefault("system:ready.event_registered", { name: event.name }),
    );
  }

  // 一括登録完了ログ
  logger.info(tDefault("system:bot.events.registered"));
}
