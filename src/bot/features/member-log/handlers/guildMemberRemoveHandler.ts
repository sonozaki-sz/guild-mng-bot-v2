// src/bot/features/member-log/handlers/guildMemberRemoveHandler.ts
// guildMemberRemove イベントのメンバーログ処理

import {
  ChannelType,
  EmbedBuilder,
  type GuildMember,
  type PartialGuildMember,
} from "discord.js";
import { getGuildTranslator } from "../../../../shared/locale/helpers";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotMemberLogConfigService } from "../../../services/botMemberLogDependencyResolver";
import { calcDuration } from "./accountAge";

// 退出通知 Embed の色（茜色）
const LEAVE_EMBED_COLOR = 0xb7282d;

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
 * guildMemberRemove 時にメンバーログ通知を送信する
 * 機能が無効またはチャンネル未設定の場合はスキップ
 * @param member 退出したギルドメンバー（Partial の可能性あり）
 * @returns 実行完了を示す Promise
 */
export async function handleGuildMemberRemove(
  member: GuildMember | PartialGuildMember,
): Promise<void> {
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
    const userId = member.user?.id ?? "unknown";
    const username = member.user?.displayName ?? "unknown";
    const userMention = `<@${userId}>`;
    const avatarUrl = member.user?.displayAvatarURL({ size: 256 }) ?? null;
    const createdTimestamp = member.user
      ? Math.floor(member.user.createdTimestamp / 1000)
      : null;
    const joinedTimestamp = member.joinedTimestamp
      ? Math.floor(member.joinedTimestamp / 1000)
      : null;
    const leftTimestamp = Math.floor(Date.now() / 1000);
    const stayDays =
      member.joinedTimestamp !== null
        ? Math.floor(
            (Date.now() - (member.joinedTimestamp ?? 0)) /
              (1000 * 60 * 60 * 24),
          )
        : null;
    const memberCount = member.guild.memberCount;

    // 退出通知 Embed を生成
    const embed = new EmbedBuilder()
      .setColor(LEAVE_EMBED_COLOR)
      .setTitle(t("events:member-log.leave.title"))
      .addFields(
        {
          name: t("events:member-log.leave.fields.username"),
          value: userMention,
          inline: true,
        },
        ...(createdTimestamp !== null
          ? [
              {
                name: t("events:member-log.leave.fields.accountCreated"),
                value: `<t:${createdTimestamp}:f>(${(() => {
                  const { years, months, days } = calcDuration(
                    member.user!.createdTimestamp,
                  );
                  const parts: string[] = [];
                  if (years > 0)
                    parts.push(
                      t("events:member-log.age.years", { count: years }),
                    );
                  if (months > 0)
                    parts.push(
                      t("events:member-log.age.months", { count: months }),
                    );
                  if (days > 0 || parts.length === 0)
                    parts.push(
                      t("events:member-log.age.days", { count: days }),
                    );
                  return parts.join(t("events:member-log.age.separator"));
                })()})`,
                inline: true,
              },
            ]
          : []),
        ...(joinedTimestamp !== null
          ? [
              {
                name: t("events:member-log.leave.fields.serverJoined"),
                value: `<t:${joinedTimestamp}:f>`,
                inline: true,
              },
            ]
          : []),
        {
          name: t("events:member-log.leave.fields.serverLeft"),
          value: `<t:${leftTimestamp}:f>`,
          inline: true,
        },
        {
          name: t("events:member-log.leave.fields.stayDuration"),
          value: (() => {
            if (stayDays === null) return t("events:member-log.unknown");
            return t("events:member-log.days", { count: stayDays });
          })(),
          inline: true,
        },
        {
          name: t("events:member-log.leave.fields.memberCount"),
          value: `${memberCount.toLocaleString()}名`,
          inline: true,
        },
      )
      .setFooter({
        text: `${t("events:member-log.leave.footer")} • Member #${memberCount + 1}`,
      })
      .setTimestamp();

    // アバター画像がある場合はサムネイルとして設定
    if (avatarUrl) {
      embed.setThumbnail(avatarUrl);
    }

    // カスタム退出メッセージが設定されている場合は content として追加
    const customMessage = config.leaveMessage
      ? formatCustomMessage(
          config.leaveMessage,
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
      tDefault("system:member-log.leave_notification_sent", {
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
