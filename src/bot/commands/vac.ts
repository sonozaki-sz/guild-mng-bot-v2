// src/bot/commands/vac.ts
// VAC管理VCの設定変更コマンド定義

import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { VAC_COMMAND } from "../features/vac/commands/vacCommand.constants";
import { executeVacCommand } from "../features/vac/commands/vacCommand.execute";
import type { Command } from "../types/discord";

export const vacCommand: Command = {
  data: (() => {
    const cmdDesc = getCommandLocalizations("vac.description");
    const renameDesc = getCommandLocalizations("vac.vc-rename.description");
    const renameNameDesc = getCommandLocalizations(
      "vac.vc-rename.name.description",
    );
    const limitDesc = getCommandLocalizations("vac.vc-limit.description");
    const limitValueDesc = getCommandLocalizations(
      "vac.vc-limit.limit.description",
    );

    return new SlashCommandBuilder()
      .setName(VAC_COMMAND.NAME)
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VAC_COMMAND.SUBCOMMAND.VC_RENAME)
          .setDescription(renameDesc.ja)
          .setDescriptionLocalizations(renameDesc.localizations)
          .addStringOption((option) =>
            option
              .setName(VAC_COMMAND.OPTION.NAME)
              .setDescription(renameNameDesc.ja)
              .setDescriptionLocalizations(renameNameDesc.localizations)
              .setRequired(true)
              .setMaxLength(100),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VAC_COMMAND.SUBCOMMAND.VC_LIMIT)
          .setDescription(limitDesc.ja)
          .setDescriptionLocalizations(limitDesc.localizations)
          .addIntegerOption((option) =>
            option
              .setName(VAC_COMMAND.OPTION.LIMIT)
              .setDescription(limitValueDesc.ja)
              .setDescriptionLocalizations(limitValueDesc.localizations)
              .setRequired(true)
              .setMinValue(VAC_COMMAND.LIMIT_MIN)
              .setMaxValue(VAC_COMMAND.LIMIT_MAX),
          ),
      );
  })(),

  /**
   * vac コマンド実行を features 側へ委譲する
   * @param interaction コマンド実行インタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: ChatInputCommandInteraction) {
    await executeVacCommand(interaction);
  },

  cooldown: 3,
};

export default vacCommand;
