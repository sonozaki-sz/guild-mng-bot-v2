// src/bot/main.ts
// Discord Bot エントリーポイント

import { Routes } from "discord.js";
import { env } from "../shared/config/env";
import { logger } from "../shared/utils/logger";
import { createBotClient } from "./client";
import { commands } from "./commands";
import { events } from "./events";

async function startBot() {
  logger.info("Discord Botを起動しています...");

  // クライアント作成
  const client = createBotClient();

  try {
    // コマンド登録
    logger.info(`${commands.length}個のコマンドを登録しています...`);

    for (const command of commands) {
      client.commands.set(command.data.name, command);
    }

    // グローバルコマンドをDiscord APIに登録
    await client.rest.put(Routes.applicationCommands(env.DISCORD_APP_ID), {
      body: commands.map((cmd) => cmd.data.toJSON()),
    });

    logger.info("コマンド登録完了");

    // イベント登録
    logger.info(`${events.length}個のイベントを登録しています...`);

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

    logger.info("イベント登録完了");

    // Discordにログイン
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    logger.error("Bot起動中にエラーが発生しました:", error);
    process.exit(1);
  }
}

// エラーハンドリング
process.on("unhandledRejection", (error) => {
  logger.error("未処理のPromise拒否:", error);
});

process.on("uncaughtException", (error) => {
  logger.error("未処理の例外:", error);
  process.exit(1);
});

// 起動
startBot().catch((error) => {
  logger.error("Bot起動失敗:", error);
  process.exit(1);
});
