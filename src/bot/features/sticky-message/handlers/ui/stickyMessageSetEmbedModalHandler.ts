// src/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler.ts
// sticky-message set（Embed 形式）モーダル送信処理

import {
  MessageFlags,
  type ModalSubmitInteraction,
  type TextChannel,
} from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import type { ModalHandler } from "../../../../handlers/interactionCreate/ui/types";
import { getBotStickyMessageConfigService } from "../../../../services/botStickyMessageDependencyResolver";
import {
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../../commands/stickyMessageCommand.constants";
import {
  buildStickyMessagePayload,
  parseColorStr,
  type StickyEmbedData,
} from "../../services/stickyMessagePayloadBuilder";

export const stickyMessageSetEmbedModalHandler: ModalHandler = {
  /**
   * ハンドラー対象の customId かを判定する
   * @param customId 判定対象の customId
   * @returns sticky-message set Embed モーダルなら true
   */
  matches(customId) {
    return customId.startsWith(
      STICKY_MESSAGE_COMMAND.SET_EMBED_MODAL_ID_PREFIX,
    );
  },

  /**
   * sticky-message set Embed モーダルの送信を処理する
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
      STICKY_MESSAGE_COMMAND.SET_EMBED_MODAL_ID_PREFIX.length,
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

    // モーダル表示から送信までの間に変更された可能性があるため再確認する
    const existing = await service.findByChannel(channelId);
    if (existing) {
      await interaction.reply({
        embeds: [
          createWarningEmbed(
            await tGuild(
              guildId,
              "commands:sticky-message.set.alreadyExists.description",
            ),
            {
              title: await tGuild(
                guildId,
                "commands:sticky-message.set.alreadyExists.title",
              ),
            },
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Guild テキストチャンネル取得
    const textChannel = guild.channels.cache.get(channelId) as
      | TextChannel
      | undefined;
    if (!textChannel) {
      throw new ValidationError(
        await tGuild(
          guildId,
          "commands:sticky-message.errors.text_channel_only",
        ),
      );
    }

    const embedPayload: StickyEmbedData = {
      title: embedTitle ?? undefined,
      description: embedDescription ?? undefined,
      color: parseColorStr(embedColorStr),
    };
    const embedData = JSON.stringify(embedPayload);

    try {
      const stickyRecord = await service.create(
        guildId,
        channelId,
        content,
        embedData,
        interaction.user.id,
      );

      const sendPayload = buildStickyMessagePayload(stickyRecord);
      const sent = await textChannel.send(sendPayload);
      await service.updateLastMessageId(stickyRecord.id, sent.id);

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            await tGuild(
              guildId,
              "commands:sticky-message.set.success.description",
            ),
            {
              title: await tGuild(
                guildId,
                "commands:sticky-message.set.success.title",
              ),
            },
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      logger.error(
        tDefault("system:sticky-message.set_embed_failed", {
          channelId,
          guildId,
        }),
        { channelId, guildId, err },
      );
      throw err;
    }
  },
};
