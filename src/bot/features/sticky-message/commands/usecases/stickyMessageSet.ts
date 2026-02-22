// src/bot/features/sticky-message/commands/usecases/stickyMessageSet.ts
// sticky-message set ユースケース

import {
  ActionRowBuilder,
  ChannelType,
  type ChatInputCommandInteraction,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { tDefault, tGuild } from "../../../../../shared/locale/localeManager";
import { getBotStickyMessageConfigService } from "../../../../services/botStickyMessageDependencyResolver";
import { createWarningEmbed } from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../stickyMessageCommand.constants";

/**
 * sticky-message set を実行する
 * チャンネルを検証し、embed オプションに応じたモーダルを表示する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleStickyMessageSet(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // channel: 第2引数 false で任意。省略時はコマンド実行チャンネルを対象にする
  const channelOption = interaction.options.getChannel(
    STICKY_MESSAGE_COMMAND.OPTION.CHANNEL,
    false,
  );
  const targetChannel = channelOption ?? interaction.channel;

  if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          await tGuild(
            guildId,
            "commands:sticky-message.errors.text_channel_only",
          ),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const service = getBotStickyMessageConfigService();

  // 同チャンネルに既存設定がないか確認する
  const existing = await service.findByChannel(targetChannel.id);
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

  const useEmbed =
    interaction.options.getBoolean(STICKY_MESSAGE_COMMAND.OPTION.EMBED) ??
    false;

  if (useEmbed) {
    // Embed モーダルを表示する（tDefault は同期）
    const modal = new ModalBuilder()
      .setCustomId(
        `${STICKY_MESSAGE_COMMAND.SET_EMBED_MODAL_ID_PREFIX}${targetChannel.id}`,
      )
      .setTitle(tDefault("commands:sticky-message.set.embed-modal.title"));

    const titleInput = new TextInputBuilder()
      .setCustomId(STICKY_MESSAGE_COMMAND.MODAL_INPUT.EMBED_TITLE)
      .setLabel(
        tDefault("commands:sticky-message.set.embed-modal.embed-title.label"),
      )
      .setPlaceholder(
        tDefault(
          "commands:sticky-message.set.embed-modal.embed-title.placeholder",
        ),
      )
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(256);

    const descriptionInput = new TextInputBuilder()
      .setCustomId(STICKY_MESSAGE_COMMAND.MODAL_INPUT.EMBED_DESCRIPTION)
      .setLabel(
        tDefault(
          "commands:sticky-message.set.embed-modal.embed-description.label",
        ),
      )
      .setPlaceholder(
        tDefault(
          "commands:sticky-message.set.embed-modal.embed-description.placeholder",
        ),
      )
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(4000);

    const colorInput = new TextInputBuilder()
      .setCustomId(STICKY_MESSAGE_COMMAND.MODAL_INPUT.EMBED_COLOR)
      .setLabel(
        tDefault("commands:sticky-message.set.embed-modal.embed-color.label"),
      )
      .setPlaceholder(
        tDefault(
          "commands:sticky-message.set.embed-modal.embed-color.placeholder",
        ),
      )
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(20);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
    );

    await interaction.showModal(modal);
  } else {
    // プレーンテキストモーダルを表示する
    const modal = new ModalBuilder()
      .setCustomId(
        `${STICKY_MESSAGE_COMMAND.SET_MODAL_ID_PREFIX}${targetChannel.id}`,
      )
      .setTitle(tDefault("commands:sticky-message.set.modal.title"));

    const messageInput = new TextInputBuilder()
      .setCustomId(STICKY_MESSAGE_COMMAND.MODAL_INPUT.MESSAGE)
      .setLabel(tDefault("commands:sticky-message.set.modal.message.label"))
      .setPlaceholder(
        tDefault("commands:sticky-message.set.modal.message.placeholder"),
      )
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput),
    );

    await interaction.showModal(modal);
  }
}
