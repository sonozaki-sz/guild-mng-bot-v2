// src/bot/commands/afk-config.ts
// AFK機能の設定コマンド（管理者専用）

import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { IGuildConfigRepository } from "../../shared/database/repositories/GuildConfigRepository";
import { ValidationError } from "../../shared/errors/CustomErrors";
import { handleCommandError } from "../../shared/errors/ErrorHandler";
import { getCommandLocalizations, t, tDefault } from "../../shared/locale";
import type { Command } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";

let repository: IGuildConfigRepository;

export const setRepository = (repo: IGuildConfigRepository) => {
  repository = repo;
};

/**
 * AFK設定コマンド（管理者専用）
 */
export const afkConfigCommand: Command = {
  data: (() => {
    const cmdDesc = getCommandLocalizations("afk-config.description");
    const setChDesc = getCommandLocalizations("afk-config.set-ch.description");
    const channelDesc = getCommandLocalizations(
      "afk-config.set-ch.channel.description",
    );
    const showDesc = getCommandLocalizations("afk-config.show.description");

    return new SlashCommandBuilder()
      .setName("afk-config")
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set-ch")
          .setDescription(setChDesc.ja)
          .setDescriptionLocalizations(setChDesc.localizations)
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription(channelDesc.ja)
              .setDescriptionLocalizations(channelDesc.localizations)
              .addChannelTypes(ChannelType.GuildVoice)
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("show")
          .setDescription(showDesc.ja)
          .setDescriptionLocalizations(showDesc.localizations),
      );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Guild ID取得
      const guildId = interaction.guildId;
      if (!guildId) {
        throw new ValidationError(tDefault("errors:validation.guild_only"));
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "set-ch":
          await handleSetChannel(interaction, guildId);
          break;

        case "show":
          await handleShowSetting(interaction, guildId);
          break;

        default:
          throw new ValidationError(
            tDefault("errors:validation.invalid_subcommand"),
          );
      }
    } catch (error) {
      // 統一エラーハンドリング
      await handleCommandError(interaction, error as Error);
    }
  },

  cooldown: 3,
};

/**
 * チャンネル設定処理
 */
async function handleSetChannel(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 管理者権限チェック
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    throw new ValidationError(
      await t(guildId, "errors:permission.administrator_required"),
    );
  }

  const channel = interaction.options.getChannel("channel", true);

  // VCチャンネルかチェック
  if (channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await t(guildId, "errors:afk.invalid_channel_type"),
    );
  }

  // Repository パターンでデータ保存
  await repository.updateAfkConfig(guildId, {
    enabled: true,
    channelId: channel.id,
  });

  // Guild別言語対応
  const message = await t(guildId, "commands:afk.configured", {
    channel: `<#${channel.id}>`,
  });

  await interaction.reply({
    content: `✅ ${message}`,
    ephemeral: true,
  });

  logger.info(
    tDefault("commands:afk.configured_log", { guildId, channelId: channel.id }),
  );
}

/**
 * 設定表示処理
 */
async function handleShowSetting(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 管理者権限チェック
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    throw new ValidationError(
      await t(guildId, "errors:permission.administrator_required"),
    );
  }

  const config = await repository.getAfkConfig(guildId);

  if (!config || !config.enabled || !config.channelId) {
    const message = await t(guildId, "commands:afk.not_configured");
    await interaction.reply({
      content: `ℹ️ ${message}`,
      ephemeral: true,
    });
    return;
  }

  const channelLabel = await t(guildId, "common:channel");
  const settingsTitle = await t(guildId, "commands:afk.settings_title");

  const message = [
    settingsTitle,
    `${channelLabel}: <#${config.channelId}>`,
  ].join("\n");

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
}

export default afkConfigCommand;
