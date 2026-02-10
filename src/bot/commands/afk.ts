// src/bot/commands/afk.ts
// AFK機能のコマンド

import {
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { IGuildConfigRepository } from "../../shared/database/repositories/GuildConfigRepository";
import { ValidationError } from "../../shared/errors/CustomErrors";
import { handleCommandError } from "../../shared/errors/ErrorHandler";
import { t, tDefault } from "../../shared/locale";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
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
 * AFKコマンド（ユーザー移動）
 */
export const afkCommand: Command = {
  data: (() => {
    const cmdDesc = getCommandLocalizations("afk.description");
    const userDesc = getCommandLocalizations("afk.user.description");

    return new SlashCommandBuilder()
      .setName("afk")
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription(userDesc.ja)
          .setDescriptionLocalizations(userDesc.localizations)
          .setRequired(false),
      );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Guild ID取得
      const guildId = interaction.guildId;
      if (!guildId) {
        throw new ValidationError(tDefault("errors:validation.guild_only"));
      }

      await handleMoveUser(interaction, guildId);
    } catch (error) {
      // 統一エラーハンドリング
      await handleCommandError(interaction, error as Error);
    }
  },

  cooldown: 3,
};

/**
 * ユーザー移動処理
 */
async function handleMoveUser(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // AFK設定を取得（優先して確認）
  const config = await repository.getAfkConfig(guildId);

  if (!config || !config.enabled || !config.channelId) {
    throw new ValidationError(await t(guildId, "errors:afk.not_configured"));
  }

  // ユーザー指定がない場合は実行者自身
  const targetUser = interaction.options.getUser("user") ?? interaction.user;
  const member = interaction.guild?.members.cache.get(targetUser.id);

  if (!member) {
    throw new ValidationError(await t(guildId, "errors:afk.member_not_found"));
  }

  // ボイスチャンネルにいるか確認
  if (!member.voice.channel) {
    throw new ValidationError(await t(guildId, "errors:afk.user_not_in_voice"));
  }

  // AFKチャンネルを取得
  const afkChannel = interaction.guild?.channels.cache.get(config.channelId);

  if (!afkChannel || afkChannel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(await t(guildId, "errors:afk.channel_not_found"));
  }

  // ユーザーを移動
  await member.voice.setChannel(afkChannel);

  const message = await t(guildId, "commands:afk.moved", {
    user: `<@${targetUser.id}>`,
    channel: `<#${config.channelId}>`,
  });

  await interaction.reply({
    content: `✅ ${message}`,
    ephemeral: false,
  });

  logger.info(
    tDefault("commands:afk.moved_log", {
      guildId,
      userId: targetUser.id,
      channelId: config.channelId,
    }),
  );
}

export default afkCommand;
