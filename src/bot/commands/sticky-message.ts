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
    const setDesc = getCommandLocalizations("sticky-message.set.description");
    const setChannelDesc = getCommandLocalizations(
      "sticky-message.set.channel.description",
    );
    const setMessageDesc = getCommandLocalizations(
      "sticky-message.set.message.description",
    );
    const setUseEmbedDesc = getCommandLocalizations(
      "sticky-message.set.use-embed.description",
    );
    const setEmbedTitleDesc = getCommandLocalizations(
      "sticky-message.set.embed-title.description",
    );
    const setEmbedDescriptionDesc = getCommandLocalizations(
      "sticky-message.set.embed-description.description",
    );
    const setEmbedColorDesc = getCommandLocalizations(
      "sticky-message.set.embed-color.description",
    );
    const removeDesc = getCommandLocalizations(
      "sticky-message.remove.description",
    );
    const removeChannelDesc = getCommandLocalizations(
      "sticky-message.remove.channel.description",
    );
    const listDesc = getCommandLocalizations("sticky-message.list.description");

    return new SlashCommandBuilder()
      .setName(STICKY_MESSAGE_COMMAND.NAME)
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
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
              .setRequired(true),
          )
          .addStringOption((opt) =>
            opt
              .setName(STICKY_MESSAGE_COMMAND.OPTION.MESSAGE)
              .setDescription(setMessageDesc.ja)
              .setDescriptionLocalizations(setMessageDesc.localizations)
              .setRequired(false)
              .setMaxLength(2000),
          )
          .addBooleanOption((opt) =>
            opt
              .setName(STICKY_MESSAGE_COMMAND.OPTION.USE_EMBED)
              .setDescription(setUseEmbedDesc.ja)
              .setDescriptionLocalizations(setUseEmbedDesc.localizations)
              .setRequired(false),
          )
          .addStringOption((opt) =>
            opt
              .setName(STICKY_MESSAGE_COMMAND.OPTION.EMBED_TITLE)
              .setDescription(setEmbedTitleDesc.ja)
              .setDescriptionLocalizations(setEmbedTitleDesc.localizations)
              .setRequired(false)
              .setMaxLength(256),
          )
          .addStringOption((opt) =>
            opt
              .setName(STICKY_MESSAGE_COMMAND.OPTION.EMBED_DESCRIPTION)
              .setDescription(setEmbedDescriptionDesc.ja)
              .setDescriptionLocalizations(
                setEmbedDescriptionDesc.localizations,
              )
              .setRequired(false)
              .setMaxLength(4096),
          )
          .addStringOption((opt) =>
            opt
              .setName(STICKY_MESSAGE_COMMAND.OPTION.EMBED_COLOR)
              .setDescription(setEmbedColorDesc.ja)
              .setDescriptionLocalizations(setEmbedColorDesc.localizations)
              .setRequired(false),
          ),
      )
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
      .addSubcommand((sub) =>
        sub
          .setName(STICKY_MESSAGE_COMMAND.SUBCOMMAND.LIST)
          .setDescription(listDesc.ja)
          .setDescriptionLocalizations(listDesc.localizations),
      );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    await executeStickyMessageCommand(interaction);
  },

  cooldown: 3,
};

export default stickyMessageCommand;
