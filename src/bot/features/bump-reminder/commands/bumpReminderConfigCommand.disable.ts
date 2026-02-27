// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.disable.ts
// bump-reminder-config disable 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { tDefault, tGuild } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import {
  getBotBumpReminderConfigService,
  getBotBumpReminderManager,
} from "../../../services/botBumpReminderDependencyResolver";
import { createSuccessEmbed } from "../../../utils/messageResponse";
import { ensureManageGuildPermission } from "./bumpReminderConfigCommand.guard";

/**
 * 通知機能を無効化する
 * 進行中のリマインダーがあれば先にキャンセルする
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleBumpReminderConfigDisable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureManageGuildPermission(interaction, guildId);

  // メモリ上の pending リマインダーをキャンセル
  const bumpReminderManager = getBotBumpReminderManager();
  await bumpReminderManager.cancelReminder(guildId);

  // 機能を無効化
  await getBotBumpReminderConfigService().setBumpReminderEnabled(
    guildId,
    false,
  );

  const description = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.disable_success",
  );
  const successTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.success_title",
  );
  const embed = createSuccessEmbed(description, { title: successTitle });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  // 監査用ログ
  logger.info(tDefault("system:bump-reminder.config_disabled", { guildId }));
}
