// src/bot/features/bump-reminder/handlers/bumpReminderHandler.ts
// Bump検知とリマインダー送信のBot層ハンドラー

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
} from "discord.js";
import {
  BUMP_CONSTANTS,
  BUMP_SERVICES,
  getBumpReminderFeatureConfigService,
  getBumpReminderManager,
  getReminderDelayMinutes,
  toScheduledAt,
  type BumpServiceName,
} from "..";
import type { BumpReminderConfigService } from "../../../../shared/features/bump-reminder";
import {
  getGuildTranslator,
  tDefault,
  type GuildTFunction,
} from "../../../../shared/locale";
import { logger } from "../../../../shared/utils";
import { createInfoEmbed } from "../../../utils/messageResponse";

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
    const bumpReminderConfigService = getBumpReminderFeatureConfigService();

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

    // 実行時タスク: 設定再取得のうえ通知送信とパネル削除を行う
    const bumpReminderManager = getBumpReminderManager();
    const reminderTask = async () => {
      // 実行時点の最新設定を参照するため、送信処理へ委譲
      // 予約時に閉じ込めず実行時再評価することで設定変更を反映する
      await sendBumpReminder(
        client,
        guildId,
        channelId,
        messageId,
        serviceName,
        bumpReminderConfigService,
        panelMessageId,
      );
    };

    try {
      // 既存予約を考慮しつつ、今回のリマインダーを登録
      // 同一キー既存予約の置換/取消は manager 側契約に委譲する
      await bumpReminderManager.setReminder(
        guildId,
        channelId,
        messageId,
        panelMessageId,
        getReminderDelayMinutes(),
        reminderTask,
        serviceName,
      );
    } catch (setReminderError) {
      // 登録失敗時は孤立パネルを削除して後片付け
      if (panelMessageId) {
        try {
          // 予約登録前に送った仮パネルを回収して孤立を防止
          const ch = await client.channels.fetch(channelId);
          if (ch?.isTextBased()) {
            const panelMsg = await ch.messages.fetch(panelMessageId);
            await panelMsg.delete();
          }
        } catch (deleteError) {
          logger.debug(
            tDefault(
              "system:scheduler.bump_reminder_orphaned_panel_delete_failed",
              {
                panelMessageId,
              },
            ),
            deleteError,
          );
        }
      }
      throw setReminderError;
    }

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
