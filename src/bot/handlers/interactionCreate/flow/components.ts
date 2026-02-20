// src/bot/handlers/interactionCreate/flow/components.ts
// ボタン / ユーザーセレクト処理

import type { ButtonInteraction, UserSelectMenuInteraction } from "discord.js";
import { tDefault } from "../../../../shared/locale";
import { logger } from "../../../../shared/utils";
import { handleInteractionError } from "../../../errors/interactionErrorHandler";
import { buttonHandlers, userSelectHandlers } from "../ui";

/**
 * ボタンインタラクションをレジストリ解決して実行する関数
 */
export async function handleButton(
  interaction: ButtonInteraction,
): Promise<void> {
  // customId に一致する最初のボタンハンドラのみ実行する
  for (const handler of buttonHandlers) {
    if (handler.matches(interaction.customId)) {
      try {
        await handler.execute(interaction);
      } catch (error) {
        logger.error(
          tDefault("system:interaction.button_error", {
            customId: interaction.customId,
          }),
          error,
        );
        await handleInteractionError(interaction, error);
      }
      // 最初に一致したハンドラのみ処理して終了
      break;
    }
  }
}

/**
 * ユーザーセレクトメニューインタラクションを処理する関数
 */
export async function handleUserSelectMenu(
  interaction: UserSelectMenuInteraction,
): Promise<void> {
  // customId に一致する最初の user-select ハンドラのみ実行する
  for (const handler of userSelectHandlers) {
    if (handler.matches(interaction.customId)) {
      try {
        await handler.execute(interaction);
      } catch (error) {
        logger.error(
          tDefault("system:interaction.select_menu_error", {
            customId: interaction.customId,
          }),
          error,
        );
        await handleInteractionError(interaction, error);
      }
      // 最初に一致したハンドラのみ処理して終了
      break;
    }
  }
}
