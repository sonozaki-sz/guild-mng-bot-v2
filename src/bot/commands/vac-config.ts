// src/bot/commands/vac-config.ts
// VC自動作成機能の設定コマンド定義

import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { autocompleteVacConfigCommand } from "../features/vac/commands/vacConfigCommand.autocomplete";
import { VAC_CONFIG_COMMAND } from "../features/vac/commands/vacConfigCommand.constants";
import { executeVacConfigCommand } from "../features/vac/commands/vacConfigCommand.execute";
import type { Command } from "../types/discord";

export const vacConfigCommand: Command = {
  data: (() => {
    const cmdDesc = getCommandLocalizations("vac-config.description");
    const createDesc = getCommandLocalizations(
      "vac-config.create-trigger-vc.description",
    );
    const removeDesc = getCommandLocalizations(
      "vac-config.remove-trigger-vc.description",
    );
    const createCategoryDesc = getCommandLocalizations(
      "vac-config.create-trigger-vc.category.description",
    );
    const removeCategoryDesc = getCommandLocalizations(
      "vac-config.remove-trigger-vc.category.description",
    );
    const showDesc = getCommandLocalizations("vac-config.show.description");

    return new SlashCommandBuilder()
      .setName(VAC_CONFIG_COMMAND.NAME)
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER)
          .setDescription(createDesc.ja)
          .setDescriptionLocalizations(createDesc.localizations)
          .addStringOption((option) =>
            option
              .setName(VAC_CONFIG_COMMAND.OPTION.CATEGORY)
              .setDescription(createCategoryDesc.ja)
              .setDescriptionLocalizations(createCategoryDesc.localizations)
              .setRequired(false)
              .setAutocomplete(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER)
          .setDescription(removeDesc.ja)
          .setDescriptionLocalizations(removeDesc.localizations)
          .addStringOption((option) =>
            option
              .setName(VAC_CONFIG_COMMAND.OPTION.CATEGORY)
              .setDescription(removeCategoryDesc.ja)
              .setDescriptionLocalizations(removeCategoryDesc.localizations)
              .setRequired(false)
              .setAutocomplete(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(VAC_CONFIG_COMMAND.SUBCOMMAND.SHOW)
          .setDescription(showDesc.ja)
          .setDescriptionLocalizations(showDesc.localizations),
      );
  })(),

  /**
   * vac-config コマンド実行を features 側へ委譲する
   * @param interaction コマンド実行インタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: ChatInputCommandInteraction) {
    await executeVacConfigCommand(interaction);
  },

  /**
   * vac-config の autocomplete 処理を features 側へ委譲する
   * @param interaction オートコンプリートインタラクション
   * @returns 実行完了を示す Promise
   */
  async autocomplete(interaction: AutocompleteInteraction) {
    await autocompleteVacConfigCommand(interaction);
  },

  cooldown: 3,
};

export default vacConfigCommand;
