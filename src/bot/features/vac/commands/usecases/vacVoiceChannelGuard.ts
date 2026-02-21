// src/bot/features/vac/commands/usecases/vacVoiceChannelGuard.ts
// VAC コマンドの操作対象VCガード

import { ChannelType, type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tGuild } from "../../../../../shared/locale/localeManager";
import { getBotVacRepository } from "../../../../services/botVacDependencyResolver";

/**
 * 実行者が参加中のVCがVAC管理下かを確認する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 管理対象VCの最小情報
 */
export async function getManagedVacVoiceChannel(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<{ id: string }> {
  // 実行者の現在接続VCを取得
  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_in_any_vc"),
    );
  }

  const isManaged = await getBotVacRepository().isManagedVacChannel(
    guildId,
    voiceChannel.id,
  );
  if (!isManaged) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  return { id: voiceChannel.id };
}
