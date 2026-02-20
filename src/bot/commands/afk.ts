// src/bot/commands/afk.ts
// AFK機能のコマンド

import {
  ChannelType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "../../shared/utils";
import {
  getBotGuildConfigRepository,
  getCommandLocalizations,
  handleCommandError,
  tDefault,
  tGuild,
  ValidationError,
} from "../services/shared-access";
import type { Command } from "../types/discord";
import { createSuccessEmbed } from "../utils/messageResponse";

// AFK コマンド本体で利用するコマンド名・オプション名定数
const AFK_COMMAND = {
  NAME: "afk",
  OPTION: {
    USER: "user",
  },
} as const;

// AFK コマンド内で参照するローカライズキーを集約する定数
const AFK_I18N_KEYS = {
  COMMAND_DESCRIPTION: "afk.description",
  USER_OPTION_DESCRIPTION: "afk.user.description",
  ERROR_GUILD_ONLY: "errors:validation.guild_only",
  ERROR_NOT_CONFIGURED: "errors:afk.not_configured",
  ERROR_MEMBER_NOT_FOUND: "errors:afk.member_not_found",
  ERROR_USER_NOT_IN_VOICE: "errors:afk.user_not_in_voice",
  ERROR_CHANNEL_NOT_FOUND: "errors:afk.channel_not_found",
  EMBED_MOVED: "commands:afk.embed.moved",
  LOG_MOVED: "system:afk.moved_log",
} as const;

/**
 * AFKコマンド（ユーザー移動）
 */
export const afkCommand: Command = {
  data: (() => {
    // 各ロケール文言を先に解決して SlashCommandBuilder へ流し込む
    const cmdDesc = getCommandLocalizations(AFK_I18N_KEYS.COMMAND_DESCRIPTION);
    const userDesc = getCommandLocalizations(
      AFK_I18N_KEYS.USER_OPTION_DESCRIPTION,
    );

    return new SlashCommandBuilder()
      .setName(AFK_COMMAND.NAME)
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .addUserOption((option) =>
        option
          .setName(AFK_COMMAND.OPTION.USER)
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
        throw new ValidationError(tDefault(AFK_I18N_KEYS.ERROR_GUILD_ONLY));
      }
      // 本体処理を関数分離し、execute は入力検証と委譲に専念
      await handleMoveUser(interaction, guildId);
    } catch (error) {
      // 統一エラーハンドリング
      await handleCommandError(interaction, error);
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
  const config = await getBotGuildConfigRepository().getAfkConfig(guildId);

  if (!config || !config.enabled || !config.channelId) {
    // 設定不足時は移動処理へ進まず、管理者向け設定導線へ戻す
    throw new ValidationError(
      await tGuild(guildId, AFK_I18N_KEYS.ERROR_NOT_CONFIGURED),
    );
  }

  // ユーザー指定がない場合は実行者自身
  const targetUser =
    interaction.options.getUser(AFK_COMMAND.OPTION.USER) ?? interaction.user;

  // キャッシュミスを防ぐため fetch を使用（キャッシュに存在しない場合も確実に取得）
  const member = await interaction.guild?.members
    .fetch(targetUser.id)
    .catch(() => null);
  // 実行時に都度 fetch して、キャッシュ古化による誤判定を避ける

  if (!member) {
    throw new ValidationError(
      await tGuild(guildId, AFK_I18N_KEYS.ERROR_MEMBER_NOT_FOUND),
    );
  }

  // ボイスチャンネルにいるか確認
  if (!member.voice.channel) {
    throw new ValidationError(
      await tGuild(guildId, AFK_I18N_KEYS.ERROR_USER_NOT_IN_VOICE),
    );
  }

  // AFKチャンネルを取得（キャッシュミスを防ぐため fetch を使用）
  const afkChannel = await interaction.guild?.channels
    .fetch(config.channelId)
    .catch(() => null);
  // 保存済み channelId が削除済みの場合を想定して実体を再検証する

  if (!afkChannel || afkChannel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, AFK_I18N_KEYS.ERROR_CHANNEL_NOT_FOUND),
    );
  }

  // ユーザーを移動
  // 実移動に成功した後のみ成功Embedを返す
  await member.voice.setChannel(afkChannel);

  const description = await tGuild(guildId, AFK_I18N_KEYS.EMBED_MOVED, {
    user: `<@${targetUser.id}>`,
    channel: `<#${config.channelId}>`,
  });

  // 返信は成功Embedのみ（AFK移動の結果を簡潔に通知）
  const embed = createSuccessEmbed(description);

  // 実行結果をユーザーへ返却
  await interaction.reply({
    embeds: [embed],
  });

  logger.info(
    tDefault(AFK_I18N_KEYS.LOG_MOVED, {
      guildId,
      userId: targetUser.id,
      channelId: config.channelId,
    }),
  );
}

export default afkCommand;
