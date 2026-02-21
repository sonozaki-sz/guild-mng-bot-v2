// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.enable.ts
// bump-reminder-config enable 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { tDefault, tGuild } from "../../../../shared/locale";
import { logger } from "../../../../shared/utils";
import { createSuccessEmbed } from "../../../utils/messageResponse";
import { getBumpReminderFeatureConfigService } from "../services";
import { ensureManageGuildPermission } from "./bumpReminderConfigCommand.guard";

/**
 * 通知機能を有効化する
 * 通知先チャンネルは実行チャンネルを採用する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleBumpReminderConfigEnable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureManageGuildPermission(interaction, guildId);

  // enable 実行チャンネルを通知先として保存
  const channelId = interaction.channelId;

  // 設定を有効化（channelId を同時保存）
  await getBumpReminderFeatureConfigService().setBumpReminderEnabled(
    guildId,
    true,
    channelId,
  );

  const description = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.enable_success",
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
  logger.info(
    tDefault("system:log.bump_reminder_enabled", { guildId, channelId }),
  );
}
