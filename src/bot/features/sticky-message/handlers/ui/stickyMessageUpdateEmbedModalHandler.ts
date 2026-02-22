// src/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler.ts
// sticky-message update（Embed 形式）モーダル送信処理

import {
  MessageFlags,
  type ModalSubmitInteraction,
  type TextChannel,
} from "discord.js";
import { tGuild } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import type { ModalHandler } from "../../../../handlers/interactionCreate/ui/types";
import { getBotStickyMessageConfigService } from "../../../../services/botStickyMessageDependencyResolver";
import {
  createInfoEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../../commands/stickyMessageCommand.constants";
import {
  buildStickyMessagePayload,
  parseColorStr,
  type StickyEmbedData,
} from "../../services/stickyMessagePayloadBuilder";

export const stickyMessageUpdateEmbedModalHandler: ModalHandler = {
  /**
   * ハンドラー対象の customId かを判定する
   * @param customId 判定対象の customId
   * @returns sticky-message update Embed モーダルなら true
   */
  matches(customId) {
    return customId.startsWith(
      STICKY_MESSAGE_COMMAND.UPDATE_EMBED_MODAL_ID_PREFIX,
    );
  },

  /**
   * sticky-message update Embed モーダルの送信を処理する
   * @param interaction モーダルインタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: ModalSubmitInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      return;
    }

    const guildId = guild.id;

    // customId からチャンネル ID を抽出する
    const channelId = interaction.customId.slice(
      STICKY_MESSAGE_COMMAND.UPDATE_EMBED_MODAL_ID_PREFIX.length,
    );

    // 各入力値を取得する（optional なのでエラーにはならない）
    const embedTitle =
      interaction.fields.getTextInputValue(
        STICKY_MESSAGE_COMMAND.MODAL_INPUT.EMBED_TITLE,
      ) || null;
    const embedDescription =
      interaction.fields.getTextInputValue(
        STICKY_MESSAGE_COMMAND.MODAL_INPUT.EMBED_DESCRIPTION,
      ) || null;
    const embedColorStr =
      interaction.fields.getTextInputValue(
        STICKY_MESSAGE_COMMAND.MODAL_INPUT.EMBED_COLOR,
      ) || null;

    // タイトルか説明文のどちらかは必須
    if (!embedTitle && !embedDescription) {
      await interaction.reply({
        embeds: [
          createWarningEmbed(
            await tGuild(
              guildId,
              "commands:sticky-message.errors.emptyMessage",
            ),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const content = embedDescription ?? embedTitle ?? "";

    const service = getBotStickyMessageConfigService();

    // モーダル表示から送信までの間に削除された可能性があるため再確認する
    const existing = await service.findByChannel(channelId);
    if (!existing) {
      await interaction.reply({
        embeds: [
          createInfoEmbed(
            await tGuild(
              guildId,
              "commands:sticky-message.remove.notFound.description",
            ),
            {
              title: await tGuild(
                guildId,
                "commands:sticky-message.update.notFound.title",
              ),
            },
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embedPayload: StickyEmbedData = {
      title: embedTitle ?? undefined,
      description: embedDescription ?? undefined,
      color: parseColorStr(embedColorStr),
    };
    const embedData = JSON.stringify(embedPayload);

    try {
      const updated = await service.updateContent(
        existing.id,
        content,
        embedData,
        interaction.user.id,
      );

      const textChannel = guild.channels.cache.get(channelId) as
        | TextChannel
        | undefined;

      if (textChannel && existing.lastMessageId) {
        // 古いスティッキーメッセージを削除する
        try {
          const msg = await textChannel.messages.fetch(existing.lastMessageId);
          await msg.delete();
        } catch {
          // 既に削除済みは無視する
        }
        // 新しい内容でスティッキーメッセージを送信する
        try {
          const payload = buildStickyMessagePayload(updated);
          const sent = await textChannel.send(payload);
          await service.updateLastMessageId(updated.id, sent.id);
        } catch (err) {
          logger.error("Failed to resend sticky message after embed update", {
            channelId,
            err,
          });
        }
      }

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            await tGuild(
              guildId,
              "commands:sticky-message.update.success.description",
            ),
            {
              title: await tGuild(
                guildId,
                "commands:sticky-message.update.success.title",
              ),
            },
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      logger.error("Failed to update sticky message (embed modal)", {
        channelId,
        guildId,
        err,
      });
      throw err;
    }
  },
};
