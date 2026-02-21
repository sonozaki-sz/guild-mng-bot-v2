// src/bot/handlers/interactionCreate/flow/modal.ts
// モーダル送信処理

import type { ModalSubmitInteraction } from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { handleInteractionError } from "../../../errors/interactionErrorHandler";
import { modalHandlers } from "../ui/modals";

/**
 * モーダル送信をレジストリで処理する関数
 */
export async function handleModalSubmit(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  // prefix マッチ型のレジストリハンドラを適用
  const registryHandler = modalHandlers.find((h) =>
    h.matches(interaction.customId),
  );
  if (!registryHandler) {
    logger.warn(
      tDefault("system:interaction.unknown_modal", {
        customId: interaction.customId,
      }),
    );
    return;
  }

  try {
    await registryHandler.execute(interaction);
    logger.debug(
      tDefault("system:interaction.modal_submitted", {
        customId: interaction.customId,
        userTag: interaction.user.tag,
      }),
    );
  } catch (error) {
    // モーダル処理失敗は同じエラーハンドラに集約
    logger.error(
      tDefault("system:interaction.modal_error", {
        customId: interaction.customId,
      }),
      error,
    );
    await handleInteractionError(interaction, error);
  }
}
