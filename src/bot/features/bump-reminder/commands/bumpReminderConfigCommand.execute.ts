// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.execute.ts
// bump-reminder-config コマンドのルーター

import { type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../shared/errors";
import { tDefault } from "../../../../shared/locale";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { BUMP_REMINDER_CONFIG_COMMAND } from "./bumpReminderConfigCommand.constants";
import { handleBumpReminderConfigDisable } from "./bumpReminderConfigCommand.disable";
import { handleBumpReminderConfigEnable } from "./bumpReminderConfigCommand.enable";
import { ensureManageGuildPermission } from "./bumpReminderConfigCommand.guard";
import { handleBumpReminderConfigRemoveMention } from "./bumpReminderConfigCommand.removeMention";
import { handleBumpReminderConfigSetMention } from "./bumpReminderConfigCommand.setMention";
import { handleBumpReminderConfigShow } from "./bumpReminderConfigCommand.show";

/**
 * bump-reminder-config の実行入口
 * Guild/権限チェック後にサブコマンド処理へ振り分ける
 * @param interaction コマンド実行インタラクション
 * @returns 実行完了を示す Promise
 */
export async function executeBumpReminderConfigCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    // Guild外実行は対象外
    const guildId = interaction.guildId;
    if (!guildId) {
      throw new ValidationError(tDefault("errors:validation.guild_only"));
    }

    // 管理権限を統一ガードで検証
    await ensureManageGuildPermission(interaction, guildId);

    // サブコマンドごとに機能別ハンドラへ委譲
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.ENABLE:
        await handleBumpReminderConfigEnable(interaction, guildId);
        break;

      case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.DISABLE:
        await handleBumpReminderConfigDisable(interaction, guildId);
        break;

      case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SET_MENTION:
        await handleBumpReminderConfigSetMention(interaction, guildId);
        break;

      case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.REMOVE_MENTION:
        await handleBumpReminderConfigRemoveMention(interaction, guildId);
        break;

      case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SHOW:
        await handleBumpReminderConfigShow(interaction, guildId);
        break;

      default:
        // 定義外サブコマンドは共通バリデーションエラー
        throw new ValidationError(
          tDefault("errors:validation.invalid_subcommand"),
        );
    }
  } catch (error) {
    // 応答整形は既存の共通ハンドラへ委譲
    await handleCommandError(interaction, error);
  }
}
