// src/bot/commands/afk-config.ts
// AFK機能の設定コマンド（サーバー管理権限専用）

import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getCommandLocalizations } from "../../shared/locale";
import { handleCommandError } from "../errors/interactionErrorHandler";
import { executeAfkConfigCommand } from "../features/afk";
import type { Command } from "../types/discord";

// AFK 設定コマンドのサブコマンド/オプション名を一元管理する定数
const AFK_CONFIG_COMMAND = {
  NAME: "afk-config",
  SUBCOMMAND: {
    SET_CHANNEL: "set-ch",
    SHOW: "show",
  },
  OPTION: {
    CHANNEL: "channel",
  },
} as const;

/**
 * AFK設定コマンド（サーバー管理権限専用）
 */
export const afkConfigCommand: Command = {
  data: (() => {
    // 各ロケール文言を先に解決して SlashCommandBuilder へ流し込む
    const cmdDesc = getCommandLocalizations("afk-config.description");
    const setChDesc = getCommandLocalizations("afk-config.set-ch.description");
    const channelDesc = getCommandLocalizations(
      "afk-config.set-ch.channel.description",
    );
    const showDesc = getCommandLocalizations("afk-config.show.description");

    return (
      new SlashCommandBuilder()
        .setName(AFK_CONFIG_COMMAND.NAME)
        .setDescription(cmdDesc.ja)
        .setDescriptionLocalizations(cmdDesc.localizations)
        // Discord 側の表示/実行制御として ManageGuild を要求
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((subcommand) =>
          // AFK チャンネル設定
          subcommand
            .setName(AFK_CONFIG_COMMAND.SUBCOMMAND.SET_CHANNEL)
            .setDescription(setChDesc.ja)
            .setDescriptionLocalizations(setChDesc.localizations)
            .addChannelOption((option) =>
              option
                .setName(AFK_CONFIG_COMMAND.OPTION.CHANNEL)
                .setDescription(channelDesc.ja)
                .setDescriptionLocalizations(channelDesc.localizations)
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          // 現在設定の表示
          subcommand
            .setName(AFK_CONFIG_COMMAND.SUBCOMMAND.SHOW)
            .setDescription(showDesc.ja)
            .setDescriptionLocalizations(showDesc.localizations),
        )
    );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await executeAfkConfigCommand(interaction);
    } catch (error) {
      // 統一エラーハンドリング
      await handleCommandError(interaction, error);
    }
  },

  cooldown: 3,
};

export default afkConfigCommand;
