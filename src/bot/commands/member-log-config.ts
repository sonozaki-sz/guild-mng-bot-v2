// src/bot/commands/member-log-config.ts
// メンバーログ機能の設定コマンド定義

import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import { MEMBER_LOG_CONFIG_COMMAND } from "../features/member-log/commands/memberLogConfigCommand.constants";
import { executeMemberLogConfigCommand } from "../features/member-log/commands/memberLogConfigCommand.execute";
import type { Command } from "../types/discord";

/**
 * メンバーログ設定コマンド（サーバー管理権限専用）
 * 通知チャンネル・有効化/無効化・カスタムメッセージの設定を提供する
 */
export const memberLogConfigCommand: Command = {
  data: (() => {
    // 各ロケール文言を先に解決して SlashCommandBuilder へ流し込む
    const cmdDesc = getCommandLocalizations("member-log-config.description");
    const setChannelDesc = getCommandLocalizations(
      "member-log-config.set-channel.description",
    );
    const setChannelChannelDesc = getCommandLocalizations(
      "member-log-config.set-channel.channel.description",
    );
    const enableDesc = getCommandLocalizations(
      "member-log-config.enable.description",
    );
    const disableDesc = getCommandLocalizations(
      "member-log-config.disable.description",
    );
    const setJoinMessageDesc = getCommandLocalizations(
      "member-log-config.set-join-message.description",
    );
    const setJoinMessageMsgDesc = getCommandLocalizations(
      "member-log-config.set-join-message.message.description",
    );
    const setLeaveMessageDesc = getCommandLocalizations(
      "member-log-config.set-leave-message.description",
    );
    const setLeaveMessageMsgDesc = getCommandLocalizations(
      "member-log-config.set-leave-message.message.description",
    );
    const viewDesc = getCommandLocalizations(
      "member-log-config.view.description",
    );

    // コマンド定義は commands 層に残し、業務処理は features 側へ委譲する
    return (
      new SlashCommandBuilder()
        .setName(MEMBER_LOG_CONFIG_COMMAND.NAME)
        .setDescription(cmdDesc.ja)
        .setDescriptionLocalizations(cmdDesc.localizations)
        // Discord 側の表示/実行制御として ManageGuild を要求
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((subcommand) =>
          // 通知チャンネル設定
          subcommand
            .setName(MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.SET_CHANNEL)
            .setDescription(setChannelDesc.ja)
            .setDescriptionLocalizations(setChannelDesc.localizations)
            .addChannelOption((option) =>
              option
                .setName(MEMBER_LOG_CONFIG_COMMAND.OPTION.CHANNEL)
                .setDescription(setChannelChannelDesc.ja)
                .setDescriptionLocalizations(
                  setChannelChannelDesc.localizations,
                )
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          // 機能有効化
          subcommand
            .setName(MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.ENABLE)
            .setDescription(enableDesc.ja)
            .setDescriptionLocalizations(enableDesc.localizations),
        )
        .addSubcommand((subcommand) =>
          // 機能無効化
          subcommand
            .setName(MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.DISABLE)
            .setDescription(disableDesc.ja)
            .setDescriptionLocalizations(disableDesc.localizations),
        )
        .addSubcommand((subcommand) =>
          // カスタム参加メッセージ設定
          subcommand
            .setName(MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.SET_JOIN_MESSAGE)
            .setDescription(setJoinMessageDesc.ja)
            .setDescriptionLocalizations(setJoinMessageDesc.localizations)
            .addStringOption((option) =>
              option
                .setName(MEMBER_LOG_CONFIG_COMMAND.OPTION.MESSAGE)
                .setDescription(setJoinMessageMsgDesc.ja)
                .setDescriptionLocalizations(
                  setJoinMessageMsgDesc.localizations,
                )
                .setRequired(true)
                .setMaxLength(500),
            ),
        )
        .addSubcommand((subcommand) =>
          // カスタム退出メッセージ設定
          subcommand
            .setName(MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.SET_LEAVE_MESSAGE)
            .setDescription(setLeaveMessageDesc.ja)
            .setDescriptionLocalizations(setLeaveMessageDesc.localizations)
            .addStringOption((option) =>
              option
                .setName(MEMBER_LOG_CONFIG_COMMAND.OPTION.MESSAGE)
                .setDescription(setLeaveMessageMsgDesc.ja)
                .setDescriptionLocalizations(
                  setLeaveMessageMsgDesc.localizations,
                )
                .setRequired(true)
                .setMaxLength(500),
            ),
        )
        .addSubcommand((subcommand) =>
          // 設定表示
          subcommand
            .setName(MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.VIEW)
            .setDescription(viewDesc.ja)
            .setDescriptionLocalizations(viewDesc.localizations),
        )
    );
  })(),

  /**
   * member-log-config コマンドの実行入口
   * @param interaction コマンド実行インタラクション
   * @returns 実行完了を示す Promise
   */
  execute: executeMemberLogConfigCommand,
};
