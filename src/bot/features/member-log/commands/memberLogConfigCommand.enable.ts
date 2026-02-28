// src/bot/features/member-log/commands/memberLogConfigCommand.enable.ts
// member-log-config enable 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { tDefault, tGuild } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotMemberLogConfigService } from "../../../services/botMemberLogDependencyResolver";
import {
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../utils/messageResponse";
import { ensureMemberLogManageGuildPermission } from "./memberLogConfigCommand.guard";

/**
 * メンバーログ機能を有効化する
 * チャンネルが未設定の場合はエラーを返す
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleMemberLogConfigEnable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureMemberLogManageGuildPermission(interaction, guildId);

  // 現在の設定を確認
  const config =
    await getBotMemberLogConfigService().getMemberLogConfig(guildId);

  // チャンネルが未設定の場合は有効化できない
  if (!config?.channelId) {
    const description = await tGuild(
      guildId,
      "commands:member-log-config.embed.enable_error_no_channel",
    );
    const embed = createWarningEmbed(description);
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 機能を有効化
  await getBotMemberLogConfigService().setEnabled(guildId, true);

  const description = await tGuild(
    guildId,
    "commands:member-log-config.embed.enable_success",
  );
  const successTitle = await tGuild(
    guildId,
    "commands:member-log-config.embed.success_title",
  );
  const embed = createSuccessEmbed(description, { title: successTitle });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  // 監査用ログ
  logger.info(tDefault("system:member-log.config_enabled", { guildId }));
}
