// src/bot/commands/sticky-message.ts
// スティッキーメッセージコマンド定義

import {
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { STICKY_MESSAGE_COMMAND } from "../features/sticky-message/commands/stickyMessageCommand.constants";
import { executeStickyMessageCommand } from "../features/sticky-message/commands/stickyMessageCommand.execute";
import type { Command } from "../types/discord";

/**
 * スティッキーメッセージコマンド
 * チャンネルの最下部に常にメッセージを固定表示する
 */
export const stickyMessageCommand: Command = {
  data: (() => {
    const cmdDesc = getCommandLocalizations("sticky-message.description");
    // set サブコマンド
    const setDesc = getCommandLocalizations("sticky-message.set.description");
    const setChannelDesc = getCommandLocalizations(
      "sticky-message.set.channel.description",
    );
    const setEmbedDesc = getCommandLocalizations(
      "sticky-message.set.embed.description",
    );
    // update サブコマンド
    const updateDesc = getCommandLocalizations(
      "sticky-message.update.description",
    );
    const updateChannelDesc = getCommandLocalizations(
      "sticky-message.update.channel.description",
    );
    const updateEmbedDesc = getCommandLocalizations(
      "sticky-message.update.embed.description",
    );
    // remove / view サブコマンド
    const removeDesc = getCommandLocalizations(
      "sticky-message.remove.description",
    );
    const removeChannelDesc = getCommandLocalizations(
      "sticky-message.remove.channel.description",
    );
    const viewDesc = getCommandLocalizations("sticky-message.view.description");

    return (
      new SlashCommandBuilder()
        .setName(STICKY_MESSAGE_COMMAND.NAME)
        .setDescription(cmdDesc.ja)
        .setDescriptionLocalizations(cmdDesc.localizations)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        /* ── set ── */
        .addSubcommand((sub) =>
          sub
            .setName(STICKY_MESSAGE_COMMAND.SUBCOMMAND.SET)
            .setDescription(setDesc.ja)
            .setDescriptionLocalizations(setDesc.localizations)
            .addChannelOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.CHANNEL)
                .setDescription(setChannelDesc.ja)
                .setDescriptionLocalizations(setChannelDesc.localizations)
                .setRequired(false),
            )
            .addBooleanOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.EMBED)
                .setDescription(setEmbedDesc.ja)
                .setDescriptionLocalizations(setEmbedDesc.localizations)
                .setRequired(false),
            ),
        )
        /* ── remove ── */
        .addSubcommand((sub) =>
          sub
            .setName(STICKY_MESSAGE_COMMAND.SUBCOMMAND.REMOVE)
            .setDescription(removeDesc.ja)
            .setDescriptionLocalizations(removeDesc.localizations)
            .addChannelOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.CHANNEL)
                .setDescription(removeChannelDesc.ja)
                .setDescriptionLocalizations(removeChannelDesc.localizations)
                .setRequired(true),
            ),
        )
        /* ── view ── */
        .addSubcommand((sub) =>
          sub
            .setName(STICKY_MESSAGE_COMMAND.SUBCOMMAND.VIEW)
            .setDescription(viewDesc.ja)
            .setDescriptionLocalizations(viewDesc.localizations),
        )
        /* ── update ── */
        .addSubcommand((sub) =>
          sub
            .setName(STICKY_MESSAGE_COMMAND.SUBCOMMAND.UPDATE)
            .setDescription(updateDesc.ja)
            .setDescriptionLocalizations(updateDesc.localizations)
            .addChannelOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.CHANNEL)
                .setDescription(updateChannelDesc.ja)
                .setDescriptionLocalizations(updateChannelDesc.localizations)
                .setRequired(false),
            )
            .addBooleanOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.EMBED)
                .setDescription(updateEmbedDesc.ja)
                .setDescriptionLocalizations(updateEmbedDesc.localizations)
                .setRequired(false),
            ),
        )
    );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    await executeStickyMessageCommand(interaction);
  },

  cooldown: 3,
};

export default stickyMessageCommand;
