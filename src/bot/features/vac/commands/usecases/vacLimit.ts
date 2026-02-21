// src/bot/features/vac/commands/usecases/vacLimit.ts
// VAC VC人数制限変更ユースケース

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tGuild } from "../../../../../shared/locale/localeManager";
import { createSuccessEmbed } from "../../../../utils/messageResponse";
import { resolveVacVoiceChannelForEdit } from "../helpers/vacVoiceChannelResolver";
import { VAC_COMMAND } from "../vacCommand.constants";

/**
 * VAC VC人数制限変更処理
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @param channelId 変更対象VCのチャンネルID
 * @returns 実行完了を示す Promise
 */
export async function executeVacLimit(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  channelId: string,
): Promise<void> {
  // 入力上限値を取得し、許容範囲を検証
  const limit = interaction.options.getInteger(VAC_COMMAND.OPTION.LIMIT, true);

  if (limit < VAC_COMMAND.LIMIT_MIN || limit > VAC_COMMAND.LIMIT_MAX) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.limit_out_of_range"),
    );
  }

  // VC解決・型検証は共通ヘルパーへ委譲し、limit更新に専念する
  const channel = await resolveVacVoiceChannelForEdit(
    interaction,
    guildId,
    channelId,
  );

  await channel.edit({ userLimit: limit });

  // 0 は無制限ラベルに変換して結果を返す
  const limitLabel =
    limit === 0
      ? await tGuild(guildId, "commands:vac.embed.unlimited")
      : String(limit);
  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac.embed.limit_changed", {
      limit: limitLabel,
    }),
  );
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
