// src/bot/features/sticky-message/commands/usecases/stickyMessageRemove.ts
// sticky-message remove ユースケース

import {
  ChannelType,
  type ChatInputCommandInteraction,
  MessageFlags,
  type TextChannel,
} from "discord.js";
import { tGuild } from "../../../../../shared/locale/localeManager";
import { getBotStickyMessageConfigService } from "../../../../services/botStickyMessageDependencyResolver";
import {
  createInfoEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import { STICKY_MESSAGE_COMMAND } from "../stickyMessageCommand.constants";

/**
 * sticky-message remove を実行する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleStickyMessageRemove(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // チャンネルオプションを取得し、テキストチャンネルであることを検証する
  const channelOption = interaction.options.getChannel(
    STICKY_MESSAGE_COMMAND.OPTION.CHANNEL,
    true,
  );

  if (channelOption.type !== ChannelType.GuildText) {
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

  // 既存設定の有無を確認する
  const existing = await service.findByChannel(channelOption.id);

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
              "commands:sticky-message.remove.notFound.title",
            ),
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
  await service.delete(existing.id);

  await interaction.reply({
    embeds: [
      createSuccessEmbed(
        await tGuild(
          guildId,
          "commands:sticky-message.remove.success.description",
        ),
        {
          title: await tGuild(
            guildId,
            "commands:sticky-message.remove.success.title",
          ),
        },
      ),
    ],
    flags: MessageFlags.Ephemeral,
  });
}
