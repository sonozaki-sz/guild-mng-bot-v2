// src/bot/main.ts
// Discord Bot エントリーポイント

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { Routes } from "discord.js";
import { env } from "../shared/config";
import { logger, setPrismaClient } from "../shared/utils";
import { createBotClient } from "./client";
import { commands } from "./commands";
import { events } from "./events";
import { registerBotEvents } from "./services/botEventRegistration";
import {
  getBotGuildConfigRepository,
  localeManager,
  setupGlobalErrorHandlers,
  setupGracefulShutdown,
  tDefault,
} from "./services/shared-access";

// コマンド登録先（ギルド/グローバル）をログ表示で識別するための定数
const COMMAND_REGISTRATION_SCOPE = {
  GUILD: "Guild",
  GLOBAL: "Global",
} as const;

// 起動失敗時に使用するプロセス終了コード定数
const PROCESS_EXIT_CODE = {
  FAILURE: 1,
} as const;

/**
 * Bot 起動シーケンスを実行するエントリー関数
 * DB接続、コマンド登録、イベント登録、ログインまでを担当する
 */
async function startBot() {
  // Prisma クライアントを adapter 経由で初期化して接続
  const adapter = new PrismaLibSql({
    url: env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  // Prismaクライアントをモジュール内に登録（イベントハンドラーからアクセス可能にする）
  setPrismaClient(prisma);

  // localeManager が guild 設定（言語）を参照できるよう repository を注入
  localeManager.setRepository(getBotGuildConfigRepository());

  // LocaleManagerを初期化
  await localeManager.initialize();

  logger.info(tDefault("system:bot.starting"));

  // Discord クライアント生成（command/cooldown など含む）
  const client = createBotClient();

  // グレースフルシャットダウンを設定
  setupGracefulShutdown(async () => {
    await client.shutdown();
    await prisma.$disconnect();
  });

  try {
    // RESTクライアントにトークンを設定
    client.rest.setToken(env.DISCORD_TOKEN);

    // ローカルレジストリへコマンド登録
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
      logger.info(
        `${tDefault("system:bot.commands.registered")} (${COMMAND_REGISTRATION_SCOPE.GUILD})`,
      );
    } else {
      // グローバルコマンドとして登録（本番用）
      await client.rest.put(Routes.applicationCommands(env.DISCORD_APP_ID), {
        body: commands.map((cmd) => cmd.data.toJSON()),
      });
      logger.info(
        `${tDefault("system:bot.commands.registered")} (${COMMAND_REGISTRATION_SCOPE.GLOBAL})`,
      );
    }

    // Discord イベントをクライアントへ登録
    registerBotEvents(client, events);

    // Discord Gateway へログイン
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    // 起動途中エラー時は DB 接続を閉じて非0終了
    logger.error(tDefault("system:bot.startup.error"), error);
    await prisma.$disconnect();
    process.exit(PROCESS_EXIT_CODE.FAILURE);
  }
}

// グローバルエラーハンドラーを設定
setupGlobalErrorHandlers();

// 起動
startBot().catch((error) => {
  // 予期しない起動例外の最終防波堤
  logger.error(tDefault("system:bot.startup.failed"), error);
  process.exit(PROCESS_EXIT_CODE.FAILURE);
});
