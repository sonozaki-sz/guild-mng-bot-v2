// src/bot/features/vac/commands/usecases/vacConfigShow.ts
// vac-config show のユースケース処理

import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { getBotVacRepository } from "../../../../services/botVacDependencyResolver";
import { createInfoEmbed } from "../../../../utils/messageResponse";
import { presentVacConfigShow } from "../presenters/vacConfigShowPresenter";

/**
 * vac-config show を実行する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleVacConfigShow(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 最新設定を読み込み、表示用の文字列へ整形
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const config = await getBotVacRepository().getVacConfigOrDefault(guildId);
  const presentation = await presentVacConfigShow(guild, guildId, config);

  // トリガー一覧と作成済みVC一覧を Embed で返す
  const embed = createInfoEmbed("", {
    title: presentation.title,
    fields: [
      {
        name: presentation.fieldTrigger,
        value: presentation.triggerChannels,
        inline: false,
      },
      {
        name: presentation.fieldCreatedDetails,
        value: presentation.createdVcDetails,
        inline: false,
      },
    ],
  });

  // 設定表示も管理操作のため Ephemeral で返す
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
