// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.show.ts
// bump-reminder-config show 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { getBumpReminderConfigService } from "../../../../shared/features/bump-reminder";
import { tGuild } from "../../../../shared/locale";
import { createInfoEmbed } from "../../../utils/messageResponse";
import { ensureManageGuildPermission } from "./bumpReminderConfigCommand.guard";

/**
 * 現在の bump-reminder 設定を表示する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定参照対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleBumpReminderConfigShow(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureManageGuildPermission(interaction, guildId);

  // 常に最新設定を取得して表示
  const config =
    await getBumpReminderConfigService().getBumpReminderConfig(guildId);

  // 未設定時は案内メッセージを返す
  if (!config) {
    const title = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.title",
    );
    const message = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.not_configured",
    );
    const embed = createInfoEmbed(message, { title });
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 表示用のローカライズ文字列を解決
  const showTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.title",
  );
  const fieldStatus = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.status",
  );
  const fieldMentionRole = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.mention_role",
  );
  const fieldMentionUsers = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.mention_users",
  );
  const labelEnabled = await tGuild(guildId, "common:enabled");
  const labelDisabled = await tGuild(guildId, "common:disabled");
  const labelNone = await tGuild(guildId, "common:none");

  // status / mention role / mention users を固定構成で表示
  const embed = createInfoEmbed("", {
    title: showTitle,
    fields: [
      {
        name: fieldStatus,
        value: config.enabled ? labelEnabled : labelDisabled,
        inline: true,
      },
      {
        name: fieldMentionRole,
        value: config.mentionRoleId ? `<@&${config.mentionRoleId}>` : labelNone,
        inline: true,
      },
      {
        name: fieldMentionUsers,
        value:
          config.mentionUserIds && config.mentionUserIds.length > 0
            ? config.mentionUserIds.map((id: string) => `<@${id}>`).join(", ")
            : labelNone,
        inline: false,
      },
    ],
  });

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
