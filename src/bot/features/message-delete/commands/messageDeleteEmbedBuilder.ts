// src/bot/features/message-delete/commands/messageDeleteEmbedBuilder.ts
// メッセージ削除結果 Embed ビルダー

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import {
  MSG_DEL_CUSTOM_ID,
  MSG_DEL_PAGE_SIZE,
  type DeletedMessageRecord,
  type MessageDeleteFilter,
} from "../constants/messageDeleteConstants";

/**
 * 削除完了サマリー Embed を生成する
 */
export function buildSummaryEmbed(
  totalDeleted: number,
  channelBreakdown: Record<string, number>,
): EmbedBuilder {
  const breakdownText =
    Object.entries(channelBreakdown)
      .map(([ch, n]) =>
        tDefault("commands:message-delete.embed.channel_breakdown_item", {
          channel: ch,
          count: n,
        }),
      )
      .join("\n") || tDefault("commands:message-delete.embed.breakdown_empty");

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(tDefault("commands:message-delete.embed.summary_title"))
    .addFields(
      {
        name: tDefault("commands:message-delete.embed.total_deleted"),
        value: `${totalDeleted}件`,
        inline: true,
      },
      {
        name: tDefault("commands:message-delete.embed.channel_breakdown"),
        value: breakdownText,
      },
    );
}

/**
 * フィルターを適用した削除済みメッセージ一覧を返す
 */
export function buildFilteredRecords(
  records: DeletedMessageRecord[],
  filter: MessageDeleteFilter,
): DeletedMessageRecord[] {
  let filtered = records;

  if (filter.authorId) {
    filtered = filtered.filter((r) => r.authorId === filter.authorId);
  }
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    filtered = filtered.filter((r) => r.content.toLowerCase().includes(kw));
  }
  // days フィルター（after/before が未指定の場合のみ適用）
  if (filter.days && !filter.after && !filter.before) {
    const threshold = Date.now() - filter.days * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((r) => r.createdAt.getTime() >= threshold);
  }
  if (filter.after) {
    const afterDate = filter.after;
    filtered = filtered.filter((r) => r.createdAt >= afterDate);
  }
  if (filter.before) {
    const beforeDate = filter.before;
    filtered = filtered.filter((r) => r.createdAt <= beforeDate);
  }

  return filtered;
}

/**
 * 削除メッセージ詳細 Embed（ページネイション）を生成する
 */
export function buildDetailEmbed(
  filtered: DeletedMessageRecord[],
  page: number,
  totalPages: number,
  filter: MessageDeleteFilter,
): EmbedBuilder {
  const start = page * MSG_DEL_PAGE_SIZE;
  const slice = filtered.slice(start, start + MSG_DEL_PAGE_SIZE);
  const hasFilter = !!(
    filter.authorId ||
    filter.keyword ||
    filter.days ||
    filter.after ||
    filter.before
  );

  const embed = new EmbedBuilder().setColor(0x3498db).setTitle(
    tDefault("commands:message-delete.embed.detail_title", {
      page: page + 1,
      total: Math.max(1, totalPages),
    }) +
      (hasFilter
        ? tDefault("commands:message-delete.embed.filter_active")
        : ""),
  );

  // after/before のフッター表示
  if (filter.after || filter.before) {
    const parts: string[] = [];
    if (filter.after)
      parts.push(`after: ${filter.after.toLocaleDateString("ja-JP")}`);
    if (filter.before)
      parts.push(`before: ${filter.before.toLocaleDateString("ja-JP")}`);
    embed.setFooter({ text: parts.join(" ～ ") });
  }

  if (slice.length === 0) {
    embed.setDescription(tDefault("commands:message-delete.embed.no_messages"));
    return embed;
  }

  for (let i = 0; i < slice.length; i++) {
    const r = slice[i];
    embed.addFields({
      name: `[${start + i + 1}] @${r.authorTag} | #${r.channelName}`,
      value:
        `${r.createdAt.toLocaleString("ja-JP")}\n` +
        `${r.content || tDefault("commands:message-delete.result.empty_content")}`,
    });
  }

  return embed;
}

/**
 * ページネイション + フィルター用コンポーネントを生成する
 */
export function buildPaginationComponents(
  allRecords: DeletedMessageRecord[],
  page: number,
  totalPages: number,
  filter: MessageDeleteFilter,
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
  const hasDays = !!filter.days;
  const hasAfterOrBefore = !!(filter.after || filter.before);

  // 投稿者セレクトメニュー
  const uniqueAuthors = [...new Set(allRecords.map((r) => r.authorTag))];
  const authorSelect = new StringSelectMenuBuilder()
    .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_AUTHOR)
    .setPlaceholder(
      tDefault("commands:message-delete.pagination.author_select_placeholder"),
    )
    .setMinValues(0)
    .setMaxValues(1)
    .addOptions(
      [
        {
          label: tDefault("commands:message-delete.pagination.author_all"),
          value: "__all__",
        },
        ...uniqueAuthors
          .slice(0, 24)
          .map((tag) => ({ label: tag, value: tag })),
      ].slice(0, 25),
    );

  // 日付・テキストフィルターボタン行
  const dateRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_DAYS)
      .setEmoji(hasDays ? "✏️" : "🔢")
      .setLabel(
        hasDays
          ? tDefault("commands:message-delete.pagination.btn_days_set", {
              days: filter.days,
            })
          : tDefault("commands:message-delete.pagination.btn_days_empty"),
      )
      .setStyle(hasDays ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(hasAfterOrBefore),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_AFTER)
      .setEmoji(filter.after ? "✏️" : "📅")
      .setLabel(
        filter.after
          ? tDefault("commands:message-delete.pagination.btn_after_set", {
              date: filter.after.toLocaleDateString("ja-JP"),
            })
          : tDefault("commands:message-delete.pagination.btn_after_empty"),
      )
      .setStyle(filter.after ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(hasDays),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_BEFORE)
      .setEmoji(filter.before ? "✏️" : "📅")
      .setLabel(
        filter.before
          ? tDefault("commands:message-delete.pagination.btn_before_set", {
              date: filter.before.toLocaleDateString("ja-JP"),
            })
          : tDefault("commands:message-delete.pagination.btn_before_empty"),
      )
      .setStyle(filter.before ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(hasDays),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_KEYWORD)
      .setEmoji("🔍")
      .setLabel(tDefault("commands:message-delete.pagination.btn_keyword"))
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.FILTER_RESET)
      .setEmoji("✖️")
      .setLabel(tDefault("commands:message-delete.pagination.btn_reset"))
      .setStyle(ButtonStyle.Danger),
  );

  // ナビゲーションボタン行
  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.PREV)
      .setEmoji("◀")
      .setLabel(tDefault("commands:message-delete.pagination.btn_prev"))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(MSG_DEL_CUSTOM_ID.NEXT)
      .setEmoji("▶")
      .setLabel(tDefault("commands:message-delete.pagination.btn_next"))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );

  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(authorSelect),
    dateRow,
    navRow,
  ];
}
