// src/bot/features/vac/commands/vacConfigCommand.autocomplete.ts
// VAC 設定コマンドの autocomplete 処理

import { AutocompleteInteraction, ChannelType } from "discord.js";
import { tGuild } from "../../../../shared/locale";
import { VAC_CONFIG_COMMAND } from "./vacConfigCommand.constants";

/**
 * vac-config のカテゴリ候補 autocomplete
 * @param interaction オートコンプリートインタラクション
 * @returns 実行完了を示す Promise
 */
export async function autocompleteVacConfigCommand(
  interaction: AutocompleteInteraction,
): Promise<void> {
  // vac-config の対象サブコマンド以外では候補を返さない
  const subcommand = interaction.options.getSubcommand();
  if (
    interaction.commandName !== VAC_CONFIG_COMMAND.NAME ||
    (subcommand !== VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER &&
      subcommand !== VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER)
  ) {
    await interaction.respond([]);
    return;
  }

  const focused = interaction.options.getFocused();
  const guild = interaction.guild;
  if (!guild) {
    // guild 文脈がないとカテゴリ候補を解決できない
    await interaction.respond([]);
    return;
  }

  const topLabel = await tGuild(
    guild.id,
    "commands:vac-config.remove-trigger-vc.category.top",
  );

  const categoryChoices = guild.channels.cache
    .filter((ch) => ch.type === ChannelType.GuildCategory)
    .map((category) => ({
      name: category.name,
      value: category.id,
    }));

  // カテゴリ候補は「TOP + カテゴリ一覧」を入力文字で絞り込む
  const choices = [
    {
      name: topLabel,
      value: VAC_CONFIG_COMMAND.TARGET.TOP,
    },
    ...categoryChoices,
  ]
    .filter((choice) =>
      choice.name.toLowerCase().includes(focused.toLowerCase()),
    )
    .slice(0, 25);

  await interaction.respond(choices);
}
