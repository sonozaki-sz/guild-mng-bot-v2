// src/bot/features/message-delete/commands/messageDeleteConfigCommand.execute.ts
// /message-delete-config コマンド実行処理

import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { getBotMessageDeleteUserSettingService } from "../../../services/botMessageDeleteDependencyResolver";
import { MSG_DEL_CONFIG_COMMAND } from "../constants/messageDeleteConstants";

/**
 * /message-delete-config コマンド実行処理
 */
export async function executeMessageDeleteConfigCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.editReply(tDefault("errors:validation.guild_only"));
      return;
    }

    const confirmEnabled = interaction.options.getBoolean(
      MSG_DEL_CONFIG_COMMAND.OPTION.CONFIRM,
      true,
    );

    // skipConfirm は confirm の逆（confirm=false → skipConfirm=true）
    const skipConfirm = !confirmEnabled;

    const service = getBotMessageDeleteUserSettingService();
    await service.updateUserSetting(interaction.user.id, guildId, {
      skipConfirm,
    });

    const statusLabel = confirmEnabled
      ? tDefault("commands:message-delete-config.result.confirm_on")
      : tDefault("commands:message-delete-config.result.confirm_off");

    await interaction.editReply(
      tDefault("commands:message-delete-config.result.updated", {
        status: statusLabel,
      }),
    );
  } catch (error) {
    await handleCommandError(interaction, error);
  }
}
