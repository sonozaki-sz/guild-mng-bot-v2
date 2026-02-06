// src/bot/commands/example-with-refactoring.ts
// リファクタリング後のコマンド実装例
// REFACTORING_PLAN.md Phase 2 & 3 準拠

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { IGuildConfigRepository } from "../../shared/database/repositories/GuildConfigRepository";
import { ValidationError } from "../../shared/errors/CustomErrors";
import { handleCommandError } from "../../shared/errors/ErrorHandler";
import { t } from "../../shared/locale/LocaleManager";
import type { Command } from "../../shared/types/discord";
import { logger } from "../../shared/utils/logger";

/**
 * Repository は DI パターンで注入される想定
 * 実際の実装では、Dependency Injection Container を使用
 */
let repository: IGuildConfigRepository;

export const setRepository = (repo: IGuildConfigRepository) => {
  repository = repo;
};

/**
 * 例: AFK設定コマンド（リファクタリング後）
 */
export const cnfAfkCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("cnf-afk")
    .setDescription("AFK機能の設定")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("enable")
        .setDescription("AFK機能を有効化")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("AFKチャンネル")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("disable").setDescription("AFK機能を無効化"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("show-setting").setDescription("現在の設定を表示"),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Guild ID取得
      const guildId = interaction.guildId;
      if (!guildId) {
        throw new ValidationError("このコマンドはサーバー内でのみ使用できます");
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "enable":
          await handleEnable(interaction, guildId);
          break;

        case "disable":
          await handleDisable(interaction, guildId);
          break;

        case "show-setting":
          await handleShowSetting(interaction, guildId);
          break;

        default:
          throw new ValidationError("無効なサブコマンドです");
      }
    } catch (error) {
      // 統一エラーハンドリング（Phase 2）
      await handleCommandError(interaction, error as Error);
    }
  },

  cooldown: 3,
};

/**
 * 有効化処理
 */
async function handleEnable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const channel = interaction.options.getChannel("channel", true);

  // Repository パターンでデータ保存（Phase 3）
  await repository.updateAfkConfig(guildId, {
    enabled: true,
    channelId: channel.id,
  });

  // Guild別言語対応（Phase 3.3）
  const message = await t(guildId, "command.afk.enabled", {
    channel: `<#${channel.id}>`,
  });

  await interaction.reply({
    content: `✅ ${message}`,
    ephemeral: false,
  });

  logger.info(`AFK enabled for guild ${guildId}, channel ${channel.id}`);
}

/**
 * 無効化処理
 */
async function handleDisable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  await repository.updateAfkConfig(guildId, {
    enabled: false,
  });

  const message = await t(guildId, "command.afk.disabled");

  await interaction.reply({
    content: `✅ ${message}`,
    ephemeral: false,
  });

  logger.info(`AFK disabled for guild ${guildId}`);
}

/**
 * 設定表示処理（Phase 3.2: show-setting統一）
 */
async function handleShowSetting(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const config = await repository.getAfkConfig(guildId);

  if (!config || !config.enabled) {
    const message = await t(guildId, "command.afk.not_configured");
    await interaction.reply({
      content: `ℹ️ ${message}`,
      ephemeral: true,
    });
    return;
  }

  const statusLabel = await t(guildId, "common.status");
  const channelLabel = await t(guildId, "common.channel");
  const enabledLabel = await t(guildId, "common.enabled");

  const message = [
    "**AFK設定**",
    `${statusLabel}: ${enabledLabel}`,
    `${channelLabel}: <#${config.channelId}>`,
  ].join("\n");

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
}

export default cnfAfkCommand;
