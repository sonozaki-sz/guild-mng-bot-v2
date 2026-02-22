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

/**
 * エラーの種別に応じたEmbedタイトル文字列を取得する
 * @param interaction 返信先インタラクション
 * @param err 発生したエラー
 * @returns Embedタイトル文字列
 */
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

/**
 * エラー内容をEmbedで返信する内部関数
 * 返信済または defer済みの場合は editReply、未返信の場合は reply を使用する
 * @param interaction 返信先インタラクション
 * @param error 発生したエラー
 * @returns 実行完了を示す Promise
 */
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

/**
 * スラッシュコマンド実行時のエラーを整形してユーザーに返信する
 * @param interaction コマンド実行インタラクション
 * @param error 発生したエラー
 * @returns 実行完了を示す Promise
 */
export const handleCommandError = async (
  interaction: ChatInputCommandInteraction,
  error: unknown,
): Promise<void> => replyWithError(interaction, error);

/**
 * 汎用インタラクション（ボタン・モーダル等）のエラーを整形してユーザーに返信する
 * @param interaction 返信可能なインタラクション
 * @param error 発生したエラー
 * @returns 実行完了を示す Promise
 */
export const handleInteractionError = async (
  interaction: RepliableInteraction,
  error: unknown,
): Promise<void> => replyWithError(interaction, error);
