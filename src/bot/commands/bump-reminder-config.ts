// src/bot/commands/bump-reminder-config.ts
// Bumpリマインダー機能の設定コマンド定義

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { BUMP_REMINDER_CONFIG_COMMAND } from "../features/bump-reminder/commands/bumpReminderConfigCommand.constants";
import { executeBumpReminderConfigCommand } from "../features/bump-reminder/commands/bumpReminderConfigCommand.execute";
import type { Command } from "../types/discord";

export const bumpReminderConfigCommand: Command = {
  data: (() => {
    // 各ロケール文言を先に解決して SlashCommandBuilder へ流し込む
    const cmdDesc = getCommandLocalizations("bump-reminder-config.description");
    const enableDesc = getCommandLocalizations(
      "bump-reminder-config.enable.description",
    );
    const disableDesc = getCommandLocalizations(
      "bump-reminder-config.disable.description",
    );
    const setMentionDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.description",
    );
    const roleDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.role.description",
    );
    const userDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.user.description",
    );
    const removeMentionDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.description",
    );
    const targetDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.description",
    );
    const targetRoleDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.role",
    );
    const targetUserDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.user",
    );
    const targetUsersDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.users",
    );
    const targetAllDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.all",
    );
    const viewDesc = getCommandLocalizations(
      "bump-reminder-config.view.description",
    );

    // コマンド定義は commands 層に残し、業務処理は features 側へ委譲する
    return (
      new SlashCommandBuilder()
        .setName(BUMP_REMINDER_CONFIG_COMMAND.NAME)
        .setDescription(cmdDesc.ja)
        .setDescriptionLocalizations(cmdDesc.localizations)
        // Discord 側の表示/実行制御として ManageGuild を要求
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((subcommand) =>
          // 機能有効化
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.ENABLE)
            .setDescription(enableDesc.ja)
            .setDescriptionLocalizations(enableDesc.localizations),
        )
        .addSubcommand((subcommand) =>
          // 機能無効化
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.DISABLE)
            .setDescription(disableDesc.ja)
            .setDescriptionLocalizations(disableDesc.localizations),
        )
        .addSubcommand((subcommand) =>
          // メンション対象設定（role/user）
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SET_MENTION)
            .setDescription(setMentionDesc.ja)
            .setDescriptionLocalizations(setMentionDesc.localizations)
            .addRoleOption((option) =>
              option
                .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.ROLE)
                .setDescription(roleDesc.ja)
                .setDescriptionLocalizations(roleDesc.localizations)
                .setRequired(false),
            )
            .addUserOption((option) =>
              option
                .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.USER)
                .setDescription(userDesc.ja)
                .setDescriptionLocalizations(userDesc.localizations)
                .setRequired(false),
            ),
        )
        .addSubcommand((subcommand) =>
          // メンション設定削除（target別）
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.REMOVE_MENTION)
            .setDescription(removeMentionDesc.ja)
            .setDescriptionLocalizations(removeMentionDesc.localizations)
            .addStringOption((option) =>
              option
                .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.TARGET)
                .setDescription(targetDesc.ja)
                .setDescriptionLocalizations(targetDesc.localizations)
                .setRequired(true)
                .addChoices(
                  {
                    name: targetRoleDesc.ja,
                    name_localizations: targetRoleDesc.localizations,
                    value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ROLE,
                  },
                  {
                    name: targetUserDesc.ja,
                    name_localizations: targetUserDesc.localizations,
                    value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USER,
                  },
                  {
                    name: targetUsersDesc.ja,
                    name_localizations: targetUsersDesc.localizations,
                    value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USERS,
                  },
                  {
                    name: targetAllDesc.ja,
                    name_localizations: targetAllDesc.localizations,
                    value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ALL,
                  },
                ),
            ),
        )
        .addSubcommand((subcommand) =>
          // 現在設定表示
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.VIEW)
            .setDescription(viewDesc.ja)
            .setDescriptionLocalizations(viewDesc.localizations),
        )
    );
  })(),

  /**
   * bump-reminder-config コマンド実行を features 側へ委譲する
   * @param interaction コマンド実行インタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction) {
    // 実行処理は features 側のルーターへ委譲
    await executeBumpReminderConfigCommand(interaction);
  },

  cooldown: 3,
};
