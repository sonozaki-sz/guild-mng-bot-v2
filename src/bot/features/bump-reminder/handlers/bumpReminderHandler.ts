// src/bot/features/bump-reminder/handlers/bumpReminderHandler.ts
// Bump検知ユースケースのオーケストレーション

import type { Client } from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotBumpReminderConfigService } from "../../../services/botBumpReminderDependencyResolver";
import {
  getReminderDelayMinutes,
  type BumpServiceName,
} from "../constants/bumpReminderConstants";
import { scheduleBumpReminder } from "./usecases/scheduleBumpReminder";
import { sendBumpPanel } from "./usecases/sendBumpPanel";

export { sendBumpPanel } from "./usecases/sendBumpPanel";
export { sendBumpReminder } from "./usecases/sendBumpReminder";

/**
 * Bump 検知時に設定確認、パネル送信、リマインダー登録を行う関数
 * @param client Discord クライアント
 * @param guildId 検知ギルドID
 * @param channelId 検知チャンネルID
 * @param messageId 検知元メッセージID
 * @param serviceName 検知サービス名
 * @returns 実行完了を示す Promise
 */
export async function handleBumpDetected(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string,
  serviceName: BumpServiceName,
): Promise<void> {
  try {
    // Bump 設定サービスを取得し、機能有効状態を確認
    const bumpReminderConfigService = getBotBumpReminderConfigService();

    const config =
      await bumpReminderConfigService.getBumpReminderConfig(guildId);
    if (!config?.enabled) {
      // 機能無効ギルドでは検知のみ行い何もしない
      logger.debug(
        tDefault("system:scheduler.bump_reminder_disabled", { guildId }),
      );
      return;
    }

    // 設定チャンネル固定時は、検知チャンネル一致時のみ処理する
    if (config.channelId && config.channelId !== channelId) {
      // 設定チャンネル外の検知はノイズとしてスキップ
      logger.debug(
        tDefault("system:scheduler.bump_reminder_unregistered_channel", {
          channelId,
          expectedChannelId: config.channelId,
          guildId,
        }),
      );
      return;
    }

    // 通知予定を示すパネルを先に送信し、メッセージIDを保持
    // 予約キーは manager 側で guild/channel/message 単位に正規化される
    const panelMessageId = await sendBumpPanel(
      client,
      guildId,
      channelId,
      messageId,
      getReminderDelayMinutes(),
    );
    // panelMessageId は未送信時 undefined のまま許容する

    await scheduleBumpReminder(
      client,
      guildId,
      channelId,
      messageId,
      serviceName,
      bumpReminderConfigService,
      panelMessageId,
    );

    // 登録完了時点で検知ログを残す
    logger.info(
      tDefault("system:bump-reminder.detected", {
        guildId,
        service: serviceName,
      }),
    );
  } catch (error) {
    logger.error(
      tDefault("system:bump-reminder.detection_failed", {
        guildId,
      }),
      error,
    );
  }
}
