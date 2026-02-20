// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard.ts
// bump-reminder-config コマンド共通ガード

import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { ValidationError } from "../../../../shared/errors";
import { tGuild } from "../../../../shared/locale";

/**
 * ManageGuild 権限を検証する共通ガード
 * @param interaction 権限を検証するコマンド実行インタラクション
 * @param guildId 権限エラーメッセージのローカライズに使うギルドID
 * @returns 検証完了を示す Promise（権限不足時は ValidationError を送出）
 */
export async function ensureManageGuildPermission(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // Discord UI 側の権限制御だけに依存せず、実行時にも明示的に確認する
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }
}
