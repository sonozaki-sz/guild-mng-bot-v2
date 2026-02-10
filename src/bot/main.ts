// src/bot/main.ts
// Discord Bot エントリーポイント

import { Routes } from "discord.js";
import { env } from "../shared/config/env";
import { tDefault } from "../shared/locale";
import { logger } from "../shared/utils/logger";
import { createBotClient } from "./client";
import { commands } from "./commands";
import { events } from "./events";

async function startBot() {
  logger.info(tDefault("system:bot.starting"));

  // クライアント作成
  const client = createBotClient();

  try {
    // コマンド登録
    logger.info(
      tDefault("system:bot.commands.registering", { count: commands.length }),
    );

    for (const command of commands) {
      client.commands.set(command.data.name, command);
    }

    // グローバルコマンドをDiscord APIに登録
    await client.rest.put(Routes.applicationCommands(env.DISCORD_APP_ID), {
      body: commands.map((cmd) => cmd.data.toJSON()),
    });

    logger.info(tDefault("system:bot.commands.registered"));

    // イベント登録
    logger.info(
      tDefault("system:bot.events.registering", { count: events.length }),
    );

    for (const event of events) {
      if (event.once) {
        // @ts-expect-error - イベントハンドラーの型は動的に決まるため
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        // @ts-expect-error - イベントハンドラーの型は動的に決まるため
        client.on(event.name, (...args) => event.execute(...args));
      }
      logger.debug(`イベント登録: ${event.name}`);
    }

    logger.info(tDefault("system:bot.events.registered"));

    // Discordにログイン
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    logger.error(tDefault("system:bot.startup.error"), error);
    process.exit(1);
  }
}

// エラーハンドリング
process.on("unhandledRejection", (error) => {
  logger.error(tDefault("system:error.unhandled_rejection"), error);
});

process.on("uncaughtException", (error) => {
  logger.error(tDefault("system:error.uncaught_exception"), error);
  process.exit(1);
});

// 起動
startBot().catch((error) => {
  logger.error(tDefault("system:bot.startup.failed"), error);
  process.exit(1);
});
