// src/bot/features/vac/commands/usecases/vacRename.ts
// VAC VC名変更ユースケース

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { tGuild } from "../../../../../shared/locale";
import { createSuccessEmbed } from "../../../../utils/messageResponse";
import { resolveVacVoiceChannelForEdit } from "../helpers/vacVoiceChannelResolver";
import { VAC_COMMAND } from "../vacCommand.constants";

/**
 * VAC VC名変更処理
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @param channelId 変更対象VCのチャンネルID
 * @returns 実行完了を示す Promise
 */
export async function executeVacRename(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  channelId: string,
): Promise<void> {
  // 入力値と対象チャンネルを解決して更新可能か検証
  const newName = interaction.options.getString(VAC_COMMAND.OPTION.NAME, true);
  const channel = await resolveVacVoiceChannelForEdit(
    interaction,
    guildId,
    channelId,
  );

  await channel.edit({ name: newName });

  // 更新結果を操作者へ通知
  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac.embed.renamed", {
      name: newName,
    }),
  );
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
