// src/bot/errors/interactionErrorHandler.ts
// コマンド/インタラクション向けエラーハンドリング

import {
  ChatInputCommandInteraction,
  MessageFlags,
  RepliableInteraction,
} from "discord.js";
import { BaseError, ValidationError } from "../../shared/errors/customErrors";
import {
  getUserFriendlyMessage,
  logError,
  toError,
} from "../../shared/errors/errorHandler";
import { tDefault, tGuild } from "../../shared/locale/localeManager";
import { logger } from "../../shared/utils/logger";
import { createErrorEmbed } from "../utils/messageResponse";

const getErrorTitle = async (
  interaction: RepliableInteraction,
  err: Error | BaseError,
): Promise<string> => {
  if (err instanceof BaseError && err.embedTitle) {
    return err.embedTitle;
  }

  if (err instanceof ValidationError) {
    if (interaction.guildId) {
      return await tGuild(interaction.guildId, "errors:validation.error_title");
    }
    return tDefault("errors:validation.error_title");
  }

  if (err instanceof BaseError && err.name) {
    return err.name;
  }

  return tDefault("errors:general.error_title");
};

const replyWithError = async (
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> => {
  const err = toError(error);
  logError(err);

  const message = getUserFriendlyMessage(err);
  const title = await getErrorTitle(interaction, err);
  const embed = createErrorEmbed(message, { title });

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  } catch (replyError) {
    logger.error(tDefault("system:error.reply_failed"), replyError);
  }
};

export const handleCommandError = async (
  interaction: ChatInputCommandInteraction,
  error: unknown,
): Promise<void> => replyWithError(interaction, error);

export const handleInteractionError = async (
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> => replyWithError(interaction, error);
