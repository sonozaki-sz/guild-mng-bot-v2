// src/bot/features/vac/commands/vacCommand.execute.ts
// VAC コマンド実行処理

import { ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../shared/errors/customErrors";
import { tDefault } from "../../../../shared/locale/localeManager";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { executeVacLimit } from "./usecases/vacLimit";
import { executeVacRename } from "./usecases/vacRename";
import { getManagedVacVoiceChannel } from "./usecases/vacVoiceChannelGuard";
import { VAC_COMMAND } from "./vacCommand.constants";

/**
 * vac コマンド実行入口
 * @param interaction コマンド実行インタラクション
 * @returns 実行完了を示す Promise
 */
export async function executeVacCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    // Guild 外実行は対象外
    const guildId = interaction.guildId;
    if (!guildId) {
      throw new ValidationError(tDefault("errors:validation.guild_only"));
    }

    // 実行者が操作可能な VAC 管理VCかを先に確定
    const voiceChannel = await getManagedVacVoiceChannel(interaction, guildId);
    const subcommand = interaction.options.getSubcommand();

    // サブコマンド別に更新処理を分岐
    switch (subcommand) {
      case VAC_COMMAND.SUBCOMMAND.VC_RENAME:
        await executeVacRename(interaction, guildId, voiceChannel.id);
        break;
      case VAC_COMMAND.SUBCOMMAND.VC_LIMIT:
        await executeVacLimit(interaction, guildId, voiceChannel.id);
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
