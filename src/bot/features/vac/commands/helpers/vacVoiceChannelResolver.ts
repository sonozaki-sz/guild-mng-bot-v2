// src/bot/features/vac/commands/helpers/vacVoiceChannelResolver.ts
// VAC コマンド向けVC解決ヘルパー

import { ChannelType, type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../../shared/errors";
import { tGuild } from "../../../../../shared/locale";

/**
 * 指定チャンネルIDから編集対象のVACボイスチャンネルを解決する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @param channelId 解決対象のチャンネルID
 * @returns 編集可能なボイスチャンネル
 */
export async function resolveVacVoiceChannelForEdit(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  channelId: string,
) {
  const channel = await interaction.guild?.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  return channel;
}
