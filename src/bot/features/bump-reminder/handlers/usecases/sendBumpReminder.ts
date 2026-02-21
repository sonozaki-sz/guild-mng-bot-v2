// src/bot/features/bump-reminder/handlers/usecases/sendBumpReminder.ts
// スケジュール到達時のBumpリマインダー送信ユースケース

import type { Client } from "discord.js";
import type { BumpReminderConfigService } from "../../../../../shared/features/bump-reminder/bumpReminderConfigService";
import { getGuildTranslator } from "../../../../../shared/locale/helpers";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import {
  BUMP_SERVICES,
  type BumpServiceName,
} from "../../constants/bumpReminderConstants";

/**
 * スケジュール到達時に Bump リマインダー通知を送信する関数
 * @param client Discord クライアント
 * @param guildId 通知対象ギルドID
 * @param channelId 通知先チャンネルID
 * @param messageId 返信参照に使う元メッセージID
 * @param serviceName 通知文言切り替え用サービス名
 * @param bumpReminderConfigService 設定取得サービス
 * @param panelMessageId 削除対象の予約パネルメッセージID
 * @returns 実行完了を示す Promise
 */
export async function sendBumpReminder(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string | undefined,
  serviceName: BumpServiceName | undefined,
  bumpReminderConfigService: BumpReminderConfigService,
  panelMessageId?: string,
): Promise<void> {
  let channel: Awaited<ReturnType<Client["channels"]["fetch"]>> | undefined;
  try {
    // 送信先チャンネルを解決し、TextBased でない場合は終了
    channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      // 削除済み/型不一致チャンネルでは通知不能
      logger.warn(
        tDefault("system:scheduler.bump_reminder_channel_not_found", {
          channelId,
          guildId,
        }),
      );
      return;
    }

    // 送信直前に最新設定を再取得し、無効化されていたら中止
    const currentConfig =
      await bumpReminderConfigService.getBumpReminderConfig(guildId);
    if (!currentConfig?.enabled) {
      // 予約後に無効化されていた場合は送信を抑止
      logger.debug(
        tDefault("system:scheduler.bump_reminder_disabled", {
          guildId,
        }),
      );
      return;
    }

    // ロール + ユーザーのメンション文字列を組み立て
    const mentions: string[] = [];
    if (currentConfig.mentionRoleId) {
      mentions.push(`<@&${currentConfig.mentionRoleId}>`);
    }
    if (
      currentConfig.mentionUserIds &&
      currentConfig.mentionUserIds.length > 0
    ) {
      // ユーザー複数指定時は順序を保ってメンション文字列化
      // 保存順を保つことで設定画面との表示差異を最小化する
      currentConfig.mentionUserIds.forEach((userId: string) => {
        mentions.push(`<@${userId}>`);
      });
    }

    // role/user の順で連結し、空の場合はメンションなし本文にする
    const mentionText = mentions.length > 0 ? mentions.join(" ") : "";

    const tGuild = await getGuildTranslator(guildId);

    // サービスごとに文言キーを切り替えて通知本文を生成
    let reminderMessage: string;
    if (serviceName === BUMP_SERVICES.DISBOARD) {
      reminderMessage = tGuild(
        "events:bump-reminder.reminder_message.disboard",
      );
    } else if (serviceName === BUMP_SERVICES.DISSOKU) {
      reminderMessage = tGuild("events:bump-reminder.reminder_message.dissoku");
    } else {
      reminderMessage = tGuild("events:bump-reminder.reminder_message");
    }

    // メンション有無に応じて本文を整形
    const content = mentionText
      ? `${mentionText}\n${reminderMessage}`
      : reminderMessage;
    // メンション文言は先頭行に固定し、通知本文の視認性を保つ

    // 元メッセージに返信できる場合は reply 形式で送信
    if (channel.isSendable()) {
      if (messageId) {
        // Bump元メッセージへスレッド的に紐づけて通知
        // messageReference により文脈追跡しやすい通知導線を維持する
        await channel.send({
          content,
          reply: { messageReference: messageId },
        });
      } else {
        // 参照元がない場合は通常メッセージとして送信
        await channel.send(content);
      }
    }
    // send 不可チャンネルでは通知を行わず、後段 cleanup のみ実行する

    logger.info(
      tDefault("system:scheduler.bump_reminder_sent", {
        guildId,
        channelId,
      }),
    );
  } finally {
    // 成功/失敗に関わらず、パネルメッセージの削除を試みる
    // cleanup 失敗は通知本体の成否と切り離して扱う
    if (panelMessageId) {
      try {
        const ch = channel?.isTextBased()
          ? channel
          : await client.channels.fetch(channelId).catch(() => null);
        if (ch?.isTextBased()) {
          const panelMessage = await ch.messages.fetch(panelMessageId);
          await panelMessage.delete();
          logger.debug(
            tDefault("system:scheduler.bump_reminder_panel_deleted", {
              panelMessageId,
              guildId,
            }),
          );
        }
      } catch (error) {
        // パネル削除失敗は通知結果を覆さないため debug ログのみ
        logger.debug(
          tDefault("system:scheduler.bump_reminder_panel_delete_failed", {
            panelMessageId,
          }),
          error,
        );
      }
    }
  }
}
