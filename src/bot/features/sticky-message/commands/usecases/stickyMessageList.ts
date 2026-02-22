// src/bot/features/sticky-message/commands/usecases/stickyMessageList.ts
// sticky-message list ユースケース

import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { getBotStickyMessageRepository } from "../../../../services/botStickyMessageDependencyResolver";
import { createInfoEmbed } from "../../../../utils/messageResponse";

/** メッセージプレビューの最大文字数 */
const PREVIEW_MAX_LENGTH = 50;

/**
 * sticky-message list を実行する
 */
export async function handleStickyMessageList(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const repository = getBotStickyMessageRepository();
  const messages = await repository.findAllByGuild(guildId);

  if (messages.length === 0) {
    await interaction.reply({
      embeds: [
        createInfoEmbed(tDefault("commands:sticky-message.list.empty"), {
          title: tDefault("commands:sticky-message.list.title"),
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📌 ${tDefault("commands:sticky-message.list.title")}`)
    .setTimestamp();

  for (const msg of messages) {
    const preview =
      msg.content.length > PREVIEW_MAX_LENGTH
        ? `${msg.content.substring(0, PREVIEW_MAX_LENGTH)}...`
        : msg.content;

    const setAt = msg.createdAt.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    embed.addFields({
      name: `<#${msg.channelId}>`,
      value: `📝 "${preview}"\n🕐 ${setAt}`,
      inline: false,
    });
  }

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
