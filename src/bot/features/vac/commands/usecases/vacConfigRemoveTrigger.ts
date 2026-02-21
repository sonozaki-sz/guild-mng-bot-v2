// src/bot/features/vac/commands/usecases/vacConfigRemoveTrigger.ts
// vac-config remove-trigger-vc のユースケース処理

import {
  ChannelType,
  type ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { ValidationError } from "../../../../../shared/errors";
import { tDefault, tGuild } from "../../../../../shared/locale";
import { getBotVacRepository } from "../../../../services/botVacDependencyResolver";
import { createSuccessEmbed } from "../../../../utils/messageResponse";
import {
  findTriggerChannelByCategory,
  resolveTargetCategory,
} from "../helpers/vacConfigTargetResolver";
import { VAC_CONFIG_COMMAND } from "../vacConfigCommand.constants";

/**
 * vac-config remove-trigger-vc を実行する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleVacConfigRemoveTrigger(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行コンテキストから対象カテゴリを解決
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const categoryOption = interaction.options.getString(
    VAC_CONFIG_COMMAND.OPTION.CATEGORY,
  );
  const category = await resolveTargetCategory(
    guild,
    interaction.channelId,
    categoryOption,
  );
  const targetCategoryId = category?.id ?? null;

  // 設定上の対象トリガーを特定
  const config = await getBotVacRepository().getVacConfigOrDefault(guildId);
  const triggerChannel = await findTriggerChannelByCategory(
    guild,
    config.triggerChannelIds,
    targetCategoryId,
  );

  if (!triggerChannel) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.trigger_not_found"),
      await tGuild(guildId, "commands:vac-config.embed.remove_error_title"),
    );
  }

  // 設定を先に更新し、実体削除は後続で試行する
  await getBotVacRepository().removeTriggerChannel(guildId, triggerChannel.id);

  const guildChannel = await interaction.guild?.channels
    .fetch(triggerChannel.id)
    .catch(() => null);
  if (guildChannel && guildChannel.type === ChannelType.GuildVoice) {
    await guildChannel.delete();
  }

  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac-config.embed.trigger_removed", {
      channel: `#${triggerChannel.name}`,
    }),
  );
  // 管理系操作の結果は Ephemeral で返してチャンネルノイズを抑える
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
