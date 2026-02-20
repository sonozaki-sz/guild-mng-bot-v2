// src/bot/handlers/clientReadyHandler.ts
// clientReady 時のBot共通ハンドラー

import { ActivityType, PresenceUpdateStatus } from "discord.js";
import { logger } from "../../shared/utils";
import type { BotClient } from "../client";
import { restoreBumpRemindersOnStartup } from "../features/bump-reminder/handlers";
import { cleanupVacOnStartup } from "../features/vac/handlers";
import { tDefault } from "../services/shared-access";

/**
 * clientReady 発火時の初期化後処理をまとめて実行する関数
 */
export async function handleClientReady(client: BotClient): Promise<void> {
  // 起動直後の基本メトリクスをログ出力
  logger.info(tDefault("system:ready.bot_ready", { tag: client.user?.tag }));
  logger.info(
    tDefault("system:ready.servers", { count: client.guilds.cache.size }),
  );
  logger.info(
    tDefault("system:ready.users", { count: client.users.cache.size }),
  );
  logger.info(
    tDefault("system:ready.commands", {
      count: client.commands.size,
    }),
  );

  // 稼働中サーバー数をプレゼンス文言へ反映
  // プレゼンス文言生成で再利用するため一度だけ取得
  const serverCount = client.guilds.cache.size;
  client.user?.setPresence({
    activities: [
      {
        name: tDefault("system:bot.presence_activity", {
          count: serverCount,
        }),
        type: ActivityType.Playing,
      },
    ],
    status: PresenceUpdateStatus.Online,
  });

  // 起動時復元・クリーンアップを順に実行
  await restoreBumpRemindersOnStartup(client);
  // Bump 復元後に VAC 掃除を行い、起動後の状態を最終整合
  await cleanupVacOnStartup(client);
}
