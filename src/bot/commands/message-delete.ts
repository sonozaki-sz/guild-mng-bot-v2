// src/bot/commands/message-delete.ts
// /message-delete コマンド定義

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { executeMessageDeleteCommand } from "../features/message-delete/commands/messageDeleteCommand.execute";
import type { Command } from "../types/discord";

/**
 * /message-delete コマンド
 * サーバー内のメッセージを一括削除する（MANAGE_MESSAGES 権限必須）
 */
export const messageDeleteCommand: Command = {
  data: (() => {
    const desc = getCommandLocalizations("message-delete.description");
    const countDesc = getCommandLocalizations(
      "message-delete.count.description",
    );
    const userDesc = getCommandLocalizations("message-delete.user.description");
    const botDesc = getCommandLocalizations("message-delete.bot.description");
    const keywordDesc = getCommandLocalizations(
      "message-delete.keyword.description",
    );
    const daysDesc = getCommandLocalizations("message-delete.days.description");
    const afterDesc = getCommandLocalizations(
      "message-delete.after.description",
    );
    const beforeDesc = getCommandLocalizations(
      "message-delete.before.description",
    );
    const channelDesc = getCommandLocalizations(
      "message-delete.channel.description",
    );

    return new SlashCommandBuilder()
      .setName("message-delete")
      .setDescription(desc.ja)
      .setDescriptionLocalizations(desc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption((opt) =>
        opt
          .setName("count")
          .setDescription(countDesc.ja)
          .setDescriptionLocalizations(countDesc.localizations)
          .setRequired(false)
          .setMinValue(1),
      )
      .addStringOption((opt) =>
        opt
          .setName("user")
          .setDescription(userDesc.ja)
          .setDescriptionLocalizations(userDesc.localizations)
          .setRequired(false),
      )
      .addBooleanOption((opt) =>
        opt
          .setName("bot")
          .setDescription(botDesc.ja)
          .setDescriptionLocalizations(botDesc.localizations)
          .setRequired(false),
      )
      .addStringOption((opt) =>
        opt
          .setName("keyword")
          .setDescription(keywordDesc.ja)
          .setDescriptionLocalizations(keywordDesc.localizations)
          .setRequired(false),
      )
      .addIntegerOption((opt) =>
        opt
          .setName("days")
          .setDescription(daysDesc.ja)
          .setDescriptionLocalizations(daysDesc.localizations)
          .setRequired(false)
          .setMinValue(1),
      )
      .addStringOption((opt) =>
        opt
          .setName("after")
          .setDescription(afterDesc.ja)
          .setDescriptionLocalizations(afterDesc.localizations)
          .setRequired(false),
      )
      .addStringOption((opt) =>
        opt
          .setName("before")
          .setDescription(beforeDesc.ja)
          .setDescriptionLocalizations(beforeDesc.localizations)
          .setRequired(false),
      )
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription(channelDesc.ja)
          .setDescriptionLocalizations(channelDesc.localizations)
          .setRequired(false),
      );
  })(),

  async execute(interaction) {
    await executeMessageDeleteCommand(interaction);
  },

  cooldown: 5,
};
