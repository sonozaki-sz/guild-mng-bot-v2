// src/bot/main.ts
// Discord Bot エントリーポイント

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { Routes } from "discord.js";
import { env } from "../shared/config/env";
import { createGuildConfigRepository } from "../shared/database/repositories/GuildConfigRepository";
import { localeManager, tDefault } from "../shared/locale";
import { logger } from "../shared/utils/logger";
import { createBotClient } from "./client";
import { commands } from "./commands";
import { setRepository as setAfkRepository } from "./commands/afk";
import { setRepository as setAfkConfigRepository } from "./commands/afk-config";
import { events } from "./events";

async function startBot() {
  const adapter = new PrismaLibSql({
    url: env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();
  const guildConfigRepository = createGuildConfigRepository(prisma);

  localeManager.setRepository(guildConfigRepository);
  setAfkRepository(guildConfigRepository);
  setAfkConfigRepository(guildConfigRepository);

  // LocaleManagerを初期化
  await localeManager.initialize();

  logger.info(tDefault("system:bot.starting"));

  // クライアント作成
  const client = createBotClient();

  try {
    // RESTクライアントにトークンを設定
    client.rest.setToken(env.DISCORD_TOKEN);

    // コマンド登録
    logger.info(
      tDefault("system:bot.commands.registering", { count: commands.length }),
    );

    for (const command of commands) {
      client.commands.set(command.data.name, command);
    }

    // コマンドをDiscord APIに登録
    // 開発中はギルドコマンド（即座に反映）、本番はグローバルコマンド（反映に最大1時間）
    if (env.DISCORD_GUILD_ID) {
      // ギルドコマンドとして登録（開発用）
      await client.rest.put(
        Routes.applicationGuildCommands(
          env.DISCORD_APP_ID,
          env.DISCORD_GUILD_ID,
        ),
        {
          body: commands.map((cmd) => cmd.data.toJSON()),
        },
      );
      logger.info(tDefault("system:bot.commands.registered") + " (Guild)");
    } else {
      // グローバルコマンドとして登録（本番用）
      await client.rest.put(Routes.applicationCommands(env.DISCORD_APP_ID), {
        body: commands.map((cmd) => cmd.data.toJSON()),
      });
      logger.info(tDefault("system:bot.commands.registered") + " (Global)");
    }

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
      logger.debug(
        tDefault("events:ready.event_registered", { name: event.name }),
      );
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
