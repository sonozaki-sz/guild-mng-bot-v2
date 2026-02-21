// src/bot/features/bump-reminder/handlers/usecases/sendBumpPanel.ts
// Bump予約時刻表示パネル送信ユースケース

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
} from "discord.js";
import {
  getGuildTranslator,
  type GuildTFunction,
} from "../../../../../shared/locale/helpers";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import { createInfoEmbed } from "../../../../utils/messageResponse";
import {
  BUMP_CONSTANTS,
  toScheduledAt,
} from "../../constants/bumpReminderConstants";

/**
 * Bump 予約時刻を表示する操作パネルメッセージを送信する関数
 * @param client Discord クライアント
 * @param guildId 通知対象ギルドID
 * @param channelId パネル送信先チャンネルID
 * @param messageId 返信参照する元メッセージID
 * @param delayMinutes 予約までの遅延分数
 * @returns 送信したパネルメッセージID（送信失敗時は undefined）
 */
export async function sendBumpPanel(
  client: Client,
  guildId: string,
  channelId: string,
  messageId: string,
  delayMinutes: number,
): Promise<string | undefined> {
  try {
    // パネル送信先チャンネルを解決し、TextBased でない場合は中止
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      // 送信不能時でも finally 側の panel cleanup は継続される
      return undefined;
    }

    const tGuild = await getGuildTranslator(guildId);

    // 通知時刻を Unix タイムスタンプ化して埋め込みに表示
    const scheduledAt = toScheduledAt(delayMinutes);
    const unixTimestamp = Math.floor(scheduledAt.getTime() / 1000);

    const embed = createInfoEmbed(
      tGuild("events:bump-reminder.panel.scheduled_at", {
        timestamp: unixTimestamp,
      }),
      { title: tGuild("events:bump-reminder.panel.title") },
    );

    // ON/OFF ボタン行を構築して元メッセージへの返信として送信
    const row = createBumpPanelButtons(guildId, tGuild);

    if (channel.isSendable()) {
      // 予約パネルは元Bumpメッセージへの返信として送信
      // 返信形式にすることで「どの bump に紐づく予約か」を視覚的に示す
      const panelMessage = await channel.send({
        embeds: [embed],
        components: [row],
        reply: { messageReference: messageId },
      });

      // 後続削除用にパネル messageId を返す
      return panelMessage.id;
    }
    return undefined;
  } catch (error) {
    // パネル送信失敗時は undefined を返し、呼び出し側で継続可能にする
    // パネル失敗はリマインダー登録全体を即中断しない設計
    logger.error(
      tDefault("system:scheduler.bump_reminder_panel_send_failed"),
      error,
    );
    return undefined;
  }
}

/**
 * Bump パネル用のボタン行を構築する関数
 * @param guildId customId 埋め込みに使用するギルドID
 * @param tGuild ギルドロケール用翻訳関数
 * @returns ON/OFF ボタンを含む ActionRow
 */
function createBumpPanelButtons(
  guildId: string,
  tGuild: GuildTFunction,
): ActionRowBuilder<ButtonBuilder> {
  // 同一guildをcustomIdへ埋め込み、他guild操作を防ぐ
  // ON/OFF の2ボタンを固定配置して自己登録/解除を切り替える
  // customId は handler 側の prefix 判定と厳密に対になる
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_ON}${guildId}`)
      .setLabel(tGuild("events:bump-reminder.panel.button_mention_on"))
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🔔"),
    new ButtonBuilder()
      .setCustomId(`${BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_OFF}${guildId}`)
      .setLabel(tGuild("events:bump-reminder.panel.button_mention_off"))
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔕"),
  );
}
