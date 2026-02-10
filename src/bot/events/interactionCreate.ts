// src/bot/events/interactionCreate.ts
// インタラクション処理イベント

import {
  handleCommandError,
  handleInteractionError,
} from "../../shared/errors/ErrorHandler";
import { tDefault } from "../../shared/locale";
import type { BotEvent } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";
import type { BotClient } from "../client";

export const interactionCreateEvent: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",
  once: false,

  async execute(interaction) {
    const client = interaction.client as BotClient;

    // スラッシュコマンド処理
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(
          tDefault("events:interaction.unknown_command", {
            commandName: interaction.commandName,
          }),
        );
        return;
      }

      // クールダウンチェック
      const cooldownTime = command.cooldown ?? 3; // デフォルト3秒
      const remaining = client.cooldownManager.check(
        command.data.name,
        interaction.user.id,
        cooldownTime,
      );

      if (remaining > 0) {
        await interaction.reply({
          content: tDefault("commands:cooldown.wait", { seconds: remaining }),
          ephemeral: true,
        });
        return;
      }

      try {
        await command.execute(interaction);
        logger.debug(
          tDefault("events:interaction.command_executed", {
            commandName: command.data.name,
            userTag: interaction.user.tag,
          }),
        );
      } catch (error) {
        logger.error(
          tDefault("events:interaction.command_error", {
            commandName: command.data.name,
          }),
          error,
        );
        await handleCommandError(interaction, error as Error);
      }
    }

    // オートコンプリート処理
    else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);

      if (!command || !command.autocomplete) {
        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        logger.error(
          tDefault("events:interaction.autocomplete_error", {
            commandName: interaction.commandName,
          }),
          error,
        );
      }
    }

    // モーダル送信処理
    else if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId);

      if (!modal) {
        logger.warn(
          tDefault("events:interaction.unknown_modal", {
            customId: interaction.customId,
          }),
        );
        return;
      }

      try {
        await modal.execute(interaction);
        logger.debug(
          tDefault("events:interaction.modal_submitted", {
            customId: interaction.customId,
            userTag: interaction.user.tag,
          }),
        );
      } catch (error) {
        logger.error(
          tDefault("events:interaction.modal_error", {
            customId: interaction.customId,
          }),
          error,
        );
        await handleInteractionError(interaction, error as Error);
      }
    }
  },
};
