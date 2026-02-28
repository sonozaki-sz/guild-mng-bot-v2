// src/bot/features/member-log/commands/memberLogConfigCommand.view.ts
// member-log-config view 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { tGuild } from "../../../../shared/locale/localeManager";
import { getBotMemberLogConfigService } from "../../../services/botMemberLogDependencyResolver";
import { createInfoEmbed } from "../../../utils/messageResponse";
import { ensureMemberLogManageGuildPermission } from "./memberLogConfigCommand.guard";

/**
 * 現在のメンバーログ設定を表示する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定参照対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleMemberLogConfigView(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureMemberLogManageGuildPermission(interaction, guildId);

  // 常に最新設定を取得して表示
  const config =
    await getBotMemberLogConfigService().getMemberLogConfig(guildId);

  // 未設定時は案内メッセージを返す
  if (!config) {
    const title = await tGuild(
      guildId,
      "commands:member-log-config.embed.title",
    );
    const message = await tGuild(
      guildId,
      "commands:member-log-config.embed.not_configured",
    );
    const embed = createInfoEmbed(message, { title });
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 表示用のローカライズ文字列を解決
  const viewTitle = await tGuild(
    guildId,
    "commands:member-log-config.embed.title",
  );
  const fieldStatus = await tGuild(
    guildId,
    "commands:member-log-config.embed.field.status",
  );
  const fieldChannel = await tGuild(
    guildId,
    "commands:member-log-config.embed.field.channel",
  );
  const fieldJoinMessage = await tGuild(
    guildId,
    "commands:member-log-config.embed.field.join_message",
  );
  const fieldLeaveMessage = await tGuild(
    guildId,
    "commands:member-log-config.embed.field.leave_message",
  );
  const labelEnabled = await tGuild(guildId, "common:enabled");
  const labelDisabled = await tGuild(guildId, "common:disabled");
  const labelNone = await tGuild(guildId, "common:none");

  // 設定内容を固定構成で表示
  const embed = createInfoEmbed("", {
    title: viewTitle,
    fields: [
      {
        name: fieldStatus,
        value: config.enabled ? labelEnabled : labelDisabled,
        inline: true,
      },
      {
        name: fieldChannel,
        value: config.channelId ? `<#${config.channelId}>` : labelNone,
        inline: true,
      },
      {
        name: fieldJoinMessage,
        value: config.joinMessage ?? labelNone,
        inline: false,
      },
      {
        name: fieldLeaveMessage,
        value: config.leaveMessage ?? labelNone,
        inline: false,
      },
    ],
  });

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
