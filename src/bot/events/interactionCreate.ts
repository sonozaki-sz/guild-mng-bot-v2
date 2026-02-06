// src/bot/events/interactionCreate.ts
// インタラクション処理イベント

import {
  handleCommandError,
  handleInteractionError,
} from "../../shared/errors/ErrorHandler";
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
        logger.warn(`Unknown command: ${interaction.commandName}`);
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
          content: `⏱️ このコマンドは **${remaining}秒後** に使用できます`,
          ephemeral: true,
        });
        return;
      }

      try {
        await command.execute(interaction);
        logger.debug(
          `Command executed: ${command.data.name} by ${interaction.user.tag}`,
        );
      } catch (error) {
        logger.error(`Error executing command ${command.data.name}:`, error);
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
          `Error in autocomplete for ${interaction.commandName}:`,
          error,
        );
      }
    }

    // モーダル送信処理
    else if (interaction.isModalSubmit()) {
      const modal = client.modals.get(interaction.customId);

      if (!modal) {
        logger.warn(`Unknown modal: ${interaction.customId}`);
        return;
      }

      try {
        await modal.execute(interaction);
        logger.debug(
          `Modal submitted: ${interaction.customId} by ${interaction.user.tag}`,
        );
      } catch (error) {
        logger.error(`Error executing modal ${interaction.customId}:`, error);
        await handleInteractionError(interaction, error as Error);
      }
    }
  },
};
