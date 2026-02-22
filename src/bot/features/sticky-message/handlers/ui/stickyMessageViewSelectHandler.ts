// src/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler.ts
// sticky-message view コマンドが送信した StringSelectMenu の選択応答を処理する

import { type StringSelectMenuInteraction } from "discord.js";
import { tGuild } from "../../../../../shared/locale/localeManager";
import type { StringSelectHandler } from "../../../../handlers/interactionCreate/ui/types";
import { getBotStickyMessageConfigService } from "../../../../services/botStickyMessageDependencyResolver";
import {
  createInfoEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
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

    const service = getBotStickyMessageConfigService();

    // 選択されたチャンネルのスティッキー設定を取得する
    const sticky = await service.findByChannel(channelId);

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
        components: interaction.message.components,
      });
      return;
    }

    // 形式（プレーン or Embed）
    const format = sticky.embedData
      ? await tGuild(guildId, "commands:sticky-message.view.field.format_embed")
      : await tGuild(
          guildId,
          "commands:sticky-message.view.field.format_plain",
        );

    // フィールド構築: 1段目（チャンネル/形式/更新日）→ 2段目（Embedメタ）→ 3段目（内容）
    const fields: { name: string; value: string; inline?: boolean }[] = [
      {
        name: await tGuild(
          guildId,
          "commands:sticky-message.view.field.channel",
        ),
        value: `<#${sticky.channelId}>`,
        inline: true,
      },
      {
        name: await tGuild(
          guildId,
          "commands:sticky-message.view.field.format",
        ),
        value: format,
        inline: true,
      },
      {
        name: await tGuild(
          guildId,
          "commands:sticky-message.view.field.updated_at",
        ),
        value: `<t:${Math.floor(sticky.updatedAt.getTime() / 1000)}:f>`,
        inline: true,
      },
    ];

    // 2段目: Embed メタ情報（設定されている場合のみ中段に挿入）
    let embedColor: number | undefined;
    if (sticky.embedData) {
      try {
        const parsed = JSON.parse(sticky.embedData) as {
          title?: string;
          color?: number;
        };
        if (parsed.title) {
          fields.push({
            name: await tGuild(
              guildId,
              "commands:sticky-message.view.field.embed_title",
            ),
            value: parsed.title,
            inline: true,
          });
        }
        if (parsed.color !== undefined) {
          embedColor = parsed.color;
          fields.push({
            name: await tGuild(
              guildId,
              "commands:sticky-message.view.field.embed_color",
            ),
            // カラーコードを色付きサムネイルとして表示（hex文字列）
            value: `#${parsed.color.toString(16).toUpperCase().padStart(6, "0")}`,
            inline: true,
          });
        }
      } catch {
        // JSON パース失敗は無視
      }
    }

    // 2段目末尾: 最終設定・更新者（Embed メタの直後に追加して右端に配置）
    if (sticky.updatedBy) {
      fields.push({
        name: await tGuild(
          guildId,
          "commands:sticky-message.view.field.updated_by",
        ),
        value: `<@${sticky.updatedBy}>`,
        inline: true,
      });
    }

    // 3段目: テキスト内容プレビュー（常に末尾）
    const preview =
      sticky.content.length > PREVIEW_MAX
        ? `${sticky.content.substring(0, PREVIEW_MAX)}...`
        : sticky.content;
    fields.push({
      name: await tGuild(guildId, "commands:sticky-message.view.field.content"),
      value: `\`\`\`\n${preview}\n\`\`\``,
      inline: false,
    });

    // createInfoEmbed で構築し、スティッキーの Embed カラーがあればそれで上書き
    const embed = createInfoEmbed("", {
      title: await tGuild(guildId, "commands:sticky-message.view.title"),
      timestamp: true,
      fields,
    });
    if (embedColor !== undefined) {
      embed.setColor(embedColor);
    }
    // タイムスタンプをスティッキーの最終更新日時で上書き
    embed.setTimestamp(sticky.updatedAt);

    // セレクトメニューを残したまま詳細 Embed を追加する
    await interaction.update({
      embeds: [embed],
      components: interaction.message.components,
    });
  },
};
