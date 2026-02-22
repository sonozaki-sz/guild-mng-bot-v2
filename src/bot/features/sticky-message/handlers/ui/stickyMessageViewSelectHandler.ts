// src/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler.ts
// sticky-message view コマンドが送信した StringSelectMenu の選択応答を処理する

import { EmbedBuilder, type StringSelectMenuInteraction } from "discord.js";
import { tGuild } from "../../../../../shared/locale/localeManager";
import type { StringSelectHandler } from "../../../../handlers/interactionCreate/ui/types";
import { getBotStickyMessageRepository } from "../../../../services/botStickyMessageDependencyResolver";
import { createWarningEmbed } from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../../commands/stickyMessageCommand.constants";

/** Embed コンテンツプレビューの最大文字数 */
const PREVIEW_MAX = 1024;

export const stickyMessageViewSelectHandler: StringSelectHandler = {
  /**
   * ハンドラが指定の customId に协台するかどうかを返す
   * @param customId セレクトメニューの customId
   * @returns 一致する場合 true
   */
  matches(customId) {
    return customId === STICKY_MESSAGE_COMMAND.VIEW_SELECT_CUSTOM_ID;
  },

  /**
   * StringSelectMenu の選択応答を処理し、選択チャンネルのスティッキー設定詳細を Embed で返信する
   * @param interaction StringSelectMenu インタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: StringSelectMenuInteraction) {
    const guildId = interaction.guildId ?? undefined;
    const channelId = interaction.values[0];
    if (!channelId) {
      await interaction.update({ components: [] });
      return;
    }

    const repository = getBotStickyMessageRepository();

    // 選択されたチャンネルのスティッキー設定を取得する
    const sticky = await repository.findByChannel(channelId);

    if (!sticky) {
      await interaction.update({
        embeds: [
          createWarningEmbed(
            await tGuild(
              guildId,
              "commands:sticky-message.remove.notFound.description",
            ),
            {
              title: await tGuild(
                guildId,
                "commands:sticky-message.view.notFound.title",
              ),
            },
          ),
        ],
        components: [],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x008969)
      .setTitle(
        `📌 ${await tGuild(guildId, "commands:sticky-message.view.title")}`,
      )
      .setTimestamp(sticky.updatedAt);

    // チャンネル情報
    embed.addFields({
      name: await tGuild(guildId, "commands:sticky-message.view.field.channel"),
      value: `<#${sticky.channelId}>`,
      inline: true,
    });

    // 形式（プレーン or Embed）
    const format = sticky.embedData
      ? await tGuild(guildId, "commands:sticky-message.view.field.format_embed")
      : await tGuild(
          guildId,
          "commands:sticky-message.view.field.format_plain",
        );
    embed.addFields({
      name: await tGuild(guildId, "commands:sticky-message.view.field.format"),
      value: format,
      inline: true,
    });

    // 最終更新日時
    embed.addFields({
      name: await tGuild(
        guildId,
        "commands:sticky-message.view.field.updated_at",
      ),
      value: `<t:${Math.floor(sticky.updatedAt.getTime() / 1000)}:f>`,
      inline: true,
    });

    // テキスト内容プレビュー
    const preview =
      sticky.content.length > PREVIEW_MAX
        ? `${sticky.content.substring(0, PREVIEW_MAX)}...`
        : sticky.content;
    embed.addFields({
      name: await tGuild(guildId, "commands:sticky-message.view.field.content"),
      value: `\`\`\`\n${preview}\n\`\`\``,
      inline: false,
    });

    // Embed メタ情報（設定されている場合のみ）
    if (sticky.embedData) {
      try {
        const parsed = JSON.parse(sticky.embedData) as {
          title?: string;
          color?: number;
        };
        if (parsed.title) {
          embed.addFields({
            name: await tGuild(
              guildId,
              "commands:sticky-message.view.field.embed_title",
            ),
            value: parsed.title,
            inline: true,
          });
        }
        if (parsed.color !== undefined) {
          embed.addFields({
            name: await tGuild(
              guildId,
              "commands:sticky-message.view.field.embed_color",
            ),
            value: `#${parsed.color.toString(16).toUpperCase().padStart(6, "0")}`,
            inline: true,
          });
        }
      } catch {
        // JSON パース失敗は無視
      }
    }

    // セレクトメニューを非表示にして詳細 Embed に置き換える
    await interaction.update({
      embeds: [embed],
      components: [],
    });
  },
};
