// src/bot/features/sticky-message/commands/stickyMessageCommand.execute.ts
// スティッキーメッセージコマンド実行処理

import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { ValidationError } from "../../../../shared/errors/customErrors";
import { tDefault, tGuild } from "../../../../shared/locale/localeManager";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { STICKY_MESSAGE_COMMAND } from "./stickyMessageCommand.constants";
import { handleStickyMessageRemove } from "./usecases/stickyMessageRemove";
import { handleStickyMessageSet } from "./usecases/stickyMessageSet";
import { handleStickyMessageUpdate } from "./usecases/stickyMessageUpdate";
import { handleStickyMessageView } from "./usecases/stickyMessageView";

/**
 * sticky-message コマンド実行入口
 * @param interaction コマンド実行インタラクション
 * @returns 実行完了を示す Promise
 */
export async function executeStickyMessageCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    // ギルドIDを取得し、サーバー内コマンドであることを確認する
    const guildId = interaction.guildId;
    if (!guildId) {
      throw new ValidationError(tDefault("errors:validation.guild_only"));
    }

    // MANAGE_CHANNELS 権限チェック
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      throw new ValidationError(
        await tGuild(
          guildId,
          "commands:sticky-message.errors.permissionDenied",
        ),
      );
    }

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case STICKY_MESSAGE_COMMAND.SUBCOMMAND.SET:
        await handleStickyMessageSet(interaction, guildId);
        break;
      case STICKY_MESSAGE_COMMAND.SUBCOMMAND.REMOVE:
        await handleStickyMessageRemove(interaction, guildId);
        break;
      case STICKY_MESSAGE_COMMAND.SUBCOMMAND.VIEW:
        await handleStickyMessageView(interaction, guildId);
        break;
      case STICKY_MESSAGE_COMMAND.SUBCOMMAND.UPDATE:
        await handleStickyMessageUpdate(interaction, guildId);
        break;
      default:
        throw new ValidationError(
          await tGuild(guildId, "errors:validation.invalid_subcommand"),
        );
    }
  } catch (error) {
    await handleCommandError(interaction, error);
  }
}
