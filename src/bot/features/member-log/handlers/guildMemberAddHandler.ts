// src/bot/features/member-log/handlers/guildMemberAddHandler.ts
// guildMemberAdd イベントのメンバーログ処理

import { ChannelType, EmbedBuilder, type GuildMember } from "discord.js";
import { getGuildTranslator } from "../../../../shared/locale/helpers";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotMemberLogConfigService } from "../../../services/botMemberLogDependencyResolver";
import { calcDuration } from "./accountAge";

// 参加通知 Embed の色（ビリジアン）
const JOIN_EMBED_COLOR = 0x008969;

/**
 * カスタムメッセージのプレースホルダーを置換する
 * @param template プレースホルダー付きテンプレート文字列
 * @param user ユーザーメンション文字列
 * @param username ユーザー名
 * @param count メンバー数
 * @returns 置換済み文字列
 */
function formatCustomMessage(
  template: string,
  user: string,
  username: string,
  count: number,
): string {
  // {user}, {username}, {count} プレースホルダーを実値へ置換
  return template
    .replace(/\{user\}/g, user)
    .replace(/\{username\}/g, username)
    .replace(/\{count\}/g, String(count));
}

/**
 * guildMemberAdd 時にメンバーログ通知を送信する
 * 機能が無効またはチャンネル未設定の場合はスキップ
 * @param member 参加したギルドメンバー
 * @returns 実行完了を示す Promise
 */
export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  const guildId = member.guild.id;

  try {
    // 設定を取得し、機能が有効かチェック
    const config =
      await getBotMemberLogConfigService().getMemberLogConfig(guildId);
    if (!config?.enabled || !config.channelId) {
      // 機能無効またはチャンネル未設定はスキップ
      return;
    }

    // 通知先チャンネルを取得
    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      // チャンネルが見つからない場合はスキップ
      logger.warn(
        tDefault("system:member-log.channel_not_found", {
          guildId,
          channelId: config.channelId,
        }),
      );
      return;
    }

    // ギルドロケールで翻訳関数を取得
    const t = await getGuildTranslator(guildId);

    // メンバー情報を収集
    const userId = member.user.id;
    const username = member.user.displayName;
    const userMention = `<@${userId}>`;
    const avatarUrl = member.user.displayAvatarURL({ size: 256 });
    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    const joinedTimestamp = member.joinedTimestamp
      ? Math.floor(member.joinedTimestamp / 1000)
      : null;
    const memberCount = member.guild.memberCount;
    const {
      years: ageYears,
      months: ageMonths,
      days: ageDays,
    } = calcDuration(member.user.createdTimestamp);

    // 参加通知 Embed を生成
    const embed = new EmbedBuilder()
      .setColor(JOIN_EMBED_COLOR)
      .setTitle(t("events:member-log.join.title"))
      .setThumbnail(avatarUrl)
      .addFields(
        {
          name: t("events:member-log.join.fields.username"),
          value: userMention,
          inline: true,
        },
        {
          name: t("events:member-log.join.fields.accountCreated"),
          value: `<t:${createdTimestamp}:f>(${(() => {
            const parts: string[] = [];
            if (ageYears > 0)
              parts.push(t("events:member-log.age.years", { count: ageYears }));
            if (ageMonths > 0)
              parts.push(
                t("events:member-log.age.months", { count: ageMonths }),
              );
            if (ageDays > 0 || parts.length === 0)
              parts.push(t("events:member-log.age.days", { count: ageDays }));
            return parts.join(t("events:member-log.age.separator"));
          })()})`,
          inline: true,
        },
        ...(joinedTimestamp !== null
          ? [
              {
                name: t("events:member-log.join.fields.serverJoined"),
                value: `<t:${joinedTimestamp}:f>`,
                inline: true,
              },
            ]
          : []),
        {
          name: t("events:member-log.join.fields.memberCount"),
          value: `${memberCount.toLocaleString()}名`,
          inline: true,
        },
      )
      .setFooter({
        text: `${t("events:member-log.join.footer")} • Member #${memberCount}`,
      })
      .setTimestamp();

    // カスタム参加メッセージが設定されている場合は content として追加
    const customMessage = config.joinMessage
      ? formatCustomMessage(
          config.joinMessage,
          userMention,
          username,
          memberCount,
        )
      : undefined;

    // 通知チャンネルへ送信
    await channel.send({
      content: customMessage,
      embeds: [embed],
    });

    // 送信完了ログ
    logger.debug(
      tDefault("system:member-log.join_notification_sent", {
        guildId,
        userId,
      }),
    );
  } catch (err) {
    // エラーが発生しても Bot のクラッシュを防ぐ
    logger.error(
      tDefault("system:member-log.notification_failed", { guildId }),
      { err },
    );
  }
}
