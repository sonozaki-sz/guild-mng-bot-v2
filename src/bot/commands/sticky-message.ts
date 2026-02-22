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
    // set サブコマンド（プレーンテキスト・モーダル入力）
    const setDesc = getCommandLocalizations("sticky-message.set.description");
    const setChannelDesc = getCommandLocalizations(
      "sticky-message.set.channel.description",
    );
    // set-embed サブコマンド（Embed 形式）
    const setEmbedDesc = getCommandLocalizations(
      "sticky-message.set-embed.description",
    );
    const setEmbedChannelDesc = getCommandLocalizations(
      "sticky-message.set-embed.channel.description",
    );
    const setEmbedTitleDesc = getCommandLocalizations(
      "sticky-message.set-embed.embed-title.description",
    );
    const setEmbedDescriptionDesc = getCommandLocalizations(
      "sticky-message.set-embed.embed-description.description",
    );
    const setEmbedColorDesc = getCommandLocalizations(
      "sticky-message.set-embed.embed-color.description",
    );
    // remove / view / update サブコマンド
    const removeDesc = getCommandLocalizations(
      "sticky-message.remove.description",
    );
    const removeChannelDesc = getCommandLocalizations(
      "sticky-message.remove.channel.description",
    );
    const viewDesc = getCommandLocalizations("sticky-message.view.description");
    const updateDesc = getCommandLocalizations(
      "sticky-message.update.description",
    );
    const updateChannelDesc = getCommandLocalizations(
      "sticky-message.update.channel.description",
    );
    // update はプレーンテキスト・Embed 両対応のためオプションを保持する
    const updateMessageDesc = getCommandLocalizations(
      "sticky-message.update.message.description",
    );
    const updateEmbedTitleDesc = getCommandLocalizations(
      "sticky-message.set-embed.embed-title.description",
    );
    const updateEmbedDescriptionDesc = getCommandLocalizations(
      "sticky-message.set-embed.embed-description.description",
    );
    const updateEmbedColorDesc = getCommandLocalizations(
      "sticky-message.set-embed.embed-color.description",
    );

    return (
      new SlashCommandBuilder()
        .setName(STICKY_MESSAGE_COMMAND.NAME)
        .setDescription(cmdDesc.ja)
        .setDescriptionLocalizations(cmdDesc.localizations)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        /* ── set（プレーンテキスト・モーダル入力） ── */
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
            ),
        )
        /* ── set-embed（Embed 形式） ── */
        .addSubcommand((sub) =>
          sub
            .setName(STICKY_MESSAGE_COMMAND.SUBCOMMAND.SET_EMBED)
            .setDescription(setEmbedDesc.ja)
            .setDescriptionLocalizations(setEmbedDesc.localizations)
            .addChannelOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.CHANNEL)
                .setDescription(setEmbedChannelDesc.ja)
                .setDescriptionLocalizations(setEmbedChannelDesc.localizations)
                .setRequired(true),
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
                .setRequired(true),
            )
            .addStringOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.MESSAGE)
                .setDescription(updateMessageDesc.ja)
                .setDescriptionLocalizations(updateMessageDesc.localizations)
                .setRequired(false)
                .setMaxLength(2000),
            )
            .addStringOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.EMBED_TITLE)
                .setDescription(updateEmbedTitleDesc.ja)
                .setDescriptionLocalizations(updateEmbedTitleDesc.localizations)
                .setRequired(false)
                .setMaxLength(256),
            )
            .addStringOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.EMBED_DESCRIPTION)
                .setDescription(updateEmbedDescriptionDesc.ja)
                .setDescriptionLocalizations(
                  updateEmbedDescriptionDesc.localizations,
                )
                .setRequired(false)
                .setMaxLength(4096),
            )
            .addStringOption((opt) =>
              opt
                .setName(STICKY_MESSAGE_COMMAND.OPTION.EMBED_COLOR)
                .setDescription(updateEmbedColorDesc.ja)
                .setDescriptionLocalizations(updateEmbedColorDesc.localizations)
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
