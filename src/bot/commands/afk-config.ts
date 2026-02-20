// src/bot/commands/afk-config.ts
// AFK機能の設定コマンド（サーバー管理権限専用）

import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
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
import { createInfoEmbed, createSuccessEmbed } from "../utils/messageResponse";

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
      // Guild ID取得
      const guildId = interaction.guildId;
      if (!guildId) {
        throw new ValidationError(tDefault("errors:validation.guild_only"));
      }

      // 実行時にも ManageGuild 権限を再検証（権限変更や想定外経路に備える）
      if (
        !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
      ) {
        throw new ValidationError(
          await tGuild(guildId, "errors:permission.manage_guild_required"),
        );
      }

      const subcommand = interaction.options.getSubcommand();

      // サブコマンドごとの処理へ振り分け
      // set/show の2系統のみを許可し、未知値は ValidationError へ集約
      switch (subcommand) {
        case AFK_CONFIG_COMMAND.SUBCOMMAND.SET_CHANNEL:
          // AFK移動先チャンネルを更新
          await handleSetChannel(interaction, guildId);
          break;

        case AFK_CONFIG_COMMAND.SUBCOMMAND.SHOW:
          // 現在のAFK設定を参照して返却
          await handleShowSetting(interaction, guildId);
          break;

        default:
          throw new ValidationError(
            tDefault("errors:validation.invalid_subcommand"),
          );
      }
    } catch (error) {
      // 統一エラーハンドリング
      await handleCommandError(interaction, error);
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
  const channel = interaction.options.getChannel(
    AFK_CONFIG_COMMAND.OPTION.CHANNEL,
    true,
  );
  // SlashCommand 側の channelTypes 制約に加え、実行時にも型を再確認する

  // VCチャンネルかチェック
  if (channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:afk.invalid_channel_type"),
    );
  }

  // Repository パターンでデータ保存（CAS更新で競合時の上書きを抑止）
  // 保存は guild 設定に対する単一責務APIへ委譲
  await getBotGuildConfigRepository().setAfkChannel(guildId, channel.id);

  // Guild別言語対応
  const description = await tGuild(
    guildId,
    "commands:afk-config.embed.set_ch_success",
    {
      channel: `<#${channel.id}>`,
    },
  );
  // 成功応答は保存済み channel.id をそのまま表示し、実際の反映先と一致させる

  const embed = createSuccessEmbed(description);
  // 設定更新系レスポンスは成功時のみ返し、途中失敗は例外に委譲

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  logger.info(
    tDefault("system:afk.configured_log", { guildId, channelId: channel.id }),
  );
}

/**
 * 設定表示処理
 */
async function handleShowSetting(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 表示は都度最新の保存設定を読み出して整合性を保つ
  const config = await getBotGuildConfigRepository().getAfkConfig(guildId);

  const title = await tGuild(guildId, "commands:afk-config.embed.title");

  // 未設定時は案内メッセージのみ返して終了
  if (!config || !config.enabled || !config.channelId) {
    // 無効状態も「未設定」と同じ案内へ寄せ、運用上の確認手順を単純化
    const description = await tGuild(
      guildId,
      "commands:afk-config.embed.not_configured",
    );
    const embed = createInfoEmbed(description, { title });
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const fieldChannel = await tGuild(
    guildId,
    "commands:afk-config.embed.field.channel",
  );

  const embed = createInfoEmbed("", {
    title,
    fields: [
      // 現在設定されているAFKチャンネルを1項目で表示
      // 表示対象を最小化し、管理コマンドの確認用途に絞る
      { name: fieldChannel, value: `<#${config.channelId}>`, inline: true },
    ],
  });
  // 追加メタ情報を載せず、設定確認の要点だけ返す

  // 設定済みならチャンネル表示のみをシンプルに返す
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

export default afkConfigCommand;
