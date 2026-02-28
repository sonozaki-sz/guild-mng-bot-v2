// src/bot/commands/message-delete-config.ts
// /message-delete-config コマンド定義

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { executeMessageDeleteConfigCommand } from "../features/message-delete/commands/messageDeleteConfigCommand.execute";
import type { Command } from "../types/discord";

/**
 * /message-delete-config コマンド
 * /message-delete の挙動設定を変更する（MANAGE_MESSAGES 権限必須）
 */
export const messageDeleteConfigCommand: Command = {
  data: (() => {
    const desc = getCommandLocalizations("message-delete-config.description");
    const confirmDesc = getCommandLocalizations(
      "message-delete-config.confirm.description",
    );

    return new SlashCommandBuilder()
      .setName("message-delete-config")
      .setDescription(desc.ja)
      .setDescriptionLocalizations(desc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addBooleanOption((opt) =>
        opt
          .setName("confirm")
          .setDescription(confirmDesc.ja)
          .setDescriptionLocalizations(confirmDesc.localizations)
          .setRequired(true),
      );
  })(),

  async execute(interaction) {
    await executeMessageDeleteConfigCommand(interaction);
  },
};
