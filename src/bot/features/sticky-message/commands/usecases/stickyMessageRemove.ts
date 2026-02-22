// src/bot/features/sticky-message/commands/usecases/stickyMessageRemove.ts
// sticky-message remove ユースケース

import {
  ChannelType,
  type ChatInputCommandInteraction,
  MessageFlags,
  type TextChannel,
} from "discord.js";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { getBotStickyMessageRepository } from "../../../../services/botStickyMessageDependencyResolver";
import {
  createInfoEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../stickyMessageCommand.constants";

/**
 * sticky-message remove を実行する
 */
export async function handleStickyMessageRemove(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  void guildId;

  const channelOption = interaction.options.getChannel(
    STICKY_MESSAGE_COMMAND.OPTION.CHANNEL,
    true,
  );

  if (channelOption.type !== ChannelType.GuildText) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          tDefault("commands:sticky-message.errors.text_channel_only"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const repository = getBotStickyMessageRepository();
  const existing = await repository.findByChannel(channelOption.id);

  if (!existing) {
    await interaction.reply({
      embeds: [
        createInfoEmbed(
          tDefault("commands:sticky-message.remove.notFound.description"),
          {
            title: tDefault("commands:sticky-message.remove.notFound.title"),
          },
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // チャンネルの最後のスティッキーメッセージを削除
  if (existing.lastMessageId) {
    const textChannel = interaction.guild?.channels.cache.get(
      channelOption.id,
    ) as TextChannel | undefined;
    if (textChannel) {
      try {
        const msg = await textChannel.messages.fetch(existing.lastMessageId);
        await msg.delete();
      } catch {
        // 既に削除済みの場合は無視
      }
    }
  }

  // DB から削除
  await repository.delete(existing.id);

  await interaction.reply({
    embeds: [
      createSuccessEmbed(
        tDefault("commands:sticky-message.remove.success.description"),
        {
          title: tDefault("commands:sticky-message.remove.success.title"),
        },
      ),
    ],
    flags: MessageFlags.Ephemeral,
  });
}
