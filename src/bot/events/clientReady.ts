// src/bot/events/clientReady.ts
// Bot起動完了イベント

import { tDefault } from "../../shared/locale";
import type { BotEvent } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";

export const clientReadyEvent: BotEvent<"clientReady"> = {
  name: "clientReady",
  once: true,

  async execute(client) {
    logger.info(tDefault("events:ready.bot_ready", { tag: client.user?.tag }));
    logger.info(
      tDefault("events:ready.servers", { count: client.guilds.cache.size }),
    );
    logger.info(
      tDefault("events:ready.users", { count: client.users.cache.size }),
    );
    logger.info(
      tDefault("events:ready.commands", { count: client.commands.size }),
    );

    // ステータス設定
    const serverCount = client.guilds.cache.size;
    client.user?.setPresence({
      activities: [
        {
          name: `${serverCount}個のサーバーで稼働中 | by sonozaki-sz`,
          type: 0,
        },
      ],
      status: "online",
    });
  },
};
