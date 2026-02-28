// src/bot/features/member-log/commands/memberLogConfigCommand.setLeaveMessage.ts
// member-log-config set-leave-message 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { tDefault, tGuild } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotMemberLogConfigService } from "../../../services/botMemberLogDependencyResolver";
import { createSuccessEmbed } from "../../../utils/messageResponse";
import { MEMBER_LOG_CONFIG_COMMAND } from "./memberLogConfigCommand.constants";
import { ensureMemberLogManageGuildPermission } from "./memberLogConfigCommand.guard";

/**
 * カスタム退出メッセージを設定する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleMemberLogConfigSetLeaveMessage(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureMemberLogManageGuildPermission(interaction, guildId);

  // メッセージオプションを取得
  const message = interaction.options.getString(
    MEMBER_LOG_CONFIG_COMMAND.OPTION.MESSAGE,
    true,
  );

  // 退出メッセージを保存
  await getBotMemberLogConfigService().setLeaveMessage(guildId, message);

  const description = await tGuild(
    guildId,
    "commands:member-log-config.embed.set_leave_message_success",
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
  logger.info(
    tDefault("system:member-log.config_leave_message_set", { guildId }),
  );
}
