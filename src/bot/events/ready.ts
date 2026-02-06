// src/bot/events/ready.ts
// Bot起動完了イベント

import type { BotEvent } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";

export const readyEvent: BotEvent<"ready"> = {
  name: "ready",
  once: true,

  async execute(client) {
    logger.info(`✅ Bot is ready! Logged in as ${client.user?.tag}`);
    logger.info(`📊 Servers: ${client.guilds.cache.size}`);
    logger.info(`👥 Users: ${client.users.cache.size}`);
    logger.info(`💬 Commands: ${client.commands.size}`);

    // ステータス設定
    client.user?.setPresence({
      activities: [{ name: "コマンドを実行中", type: 0 }],
      status: "online",
    });
  },
};
