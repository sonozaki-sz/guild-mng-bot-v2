// src/bot/features/vac/commands/vacConfigCommand.execute.ts
// VAC 設定コマンド実行処理

import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { ValidationError } from "../../../../shared/errors/customErrors";
import { tDefault } from "../../../../shared/locale/localeManager";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { handleVacConfigCreateTrigger } from "./usecases/vacConfigCreateTrigger";
import { handleVacConfigRemoveTrigger } from "./usecases/vacConfigRemoveTrigger";
import { handleVacConfigShow } from "./usecases/vacConfigShow";
import { VAC_CONFIG_COMMAND } from "./vacConfigCommand.constants";

/**
 * vac-config コマンド実行入口
 * @param interaction コマンド実行インタラクション
 * @returns 実行完了を示す Promise
 */
export async function executeVacConfigCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    // Guild 外実行は設定変更対象外
    const guildId = interaction.guildId;
    if (!guildId) {
      throw new ValidationError(tDefault("errors:validation.guild_only"));
    }

    // 実行前に管理権限を検証
    ensureManageGuildPermission(interaction, guildId);

    // サブコマンド別に処理を委譲
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER:
        await handleVacConfigCreateTrigger(interaction, guildId);
        break;
      case VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER:
        await handleVacConfigRemoveTrigger(interaction, guildId);
        break;
      case VAC_CONFIG_COMMAND.SUBCOMMAND.SHOW:
        await handleVacConfigShow(interaction, guildId);
        break;
      default:
        throw new ValidationError(
          tDefault("errors:validation.invalid_subcommand"),
        );
    }
  } catch (error) {
    await handleCommandError(interaction, error);
  }
}

/**
 * 実行ユーザーがサーバー管理権限を持つか検証する関数
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 検証完了（権限不足時は例外送出）
 */
function ensureManageGuildPermission(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): void {
  // Discord UI 側の既定権限に依存せず、実行時にも管理権限を確認
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      tDefault("errors:permission.manage_guild_required", { guildId }),
    );
  }
}
