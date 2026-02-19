// src/bot/commands/vac.ts
// VAC管理VCの設定変更コマンド

import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../bot/types/discord";
import { createSuccessEmbed } from "../../bot/utils/messageResponse";
import {
  isManagedVacChannel
} from "../services/shared-access";
import {
  getCommandLocalizations,
  tDefault,
  tGuild
} from "../services/shared-access";
import {
  handleCommandError,
  ValidationError
} from "../services/shared-access";

// VAC コマンドで使用するサブコマンド名・オプション名・入力制約の定数
const VAC_COMMAND = {
  NAME: "vac",
  SUBCOMMAND: {
    VC_RENAME: "vc-rename",
    VC_LIMIT: "vc-limit",
  },
  OPTION: {
    NAME: "name",
    LIMIT: "limit",
  },
  LIMIT_MIN: 0,
  LIMIT_MAX: 99,
} as const;

export const vacCommand: Command = {
  data: (() => {
    // 各ロケール文言を先に解決して SlashCommandBuilder へ流し込む
    const cmdDesc = getCommandLocalizations("vac.description");
    const renameDesc = getCommandLocalizations("vac.vc-rename.description");
    const renameNameDesc = getCommandLocalizations(
      "vac.vc-rename.name.description",
    );
    const limitDesc = getCommandLocalizations("vac.vc-limit.description");
    const limitValueDesc = getCommandLocalizations(
      "vac.vc-limit.limit.description",
    );

    return new SlashCommandBuilder()
      .setName(VAC_COMMAND.NAME)
      .setDescription(cmdDesc.ja)
      .setDescriptionLocalizations(cmdDesc.localizations)
      .addSubcommand((subcommand) =>
        // VC名変更
        subcommand
          .setName(VAC_COMMAND.SUBCOMMAND.VC_RENAME)
          .setDescription(renameDesc.ja)
          .setDescriptionLocalizations(renameDesc.localizations)
          .addStringOption((option) =>
            option
              .setName(VAC_COMMAND.OPTION.NAME)
              .setDescription(renameNameDesc.ja)
              .setDescriptionLocalizations(renameNameDesc.localizations)
              .setRequired(true)
              .setMaxLength(100),
          ),
      )
      .addSubcommand((subcommand) =>
        // VC人数制限変更
        subcommand
          .setName(VAC_COMMAND.SUBCOMMAND.VC_LIMIT)
          .setDescription(limitDesc.ja)
          .setDescriptionLocalizations(limitDesc.localizations)
          .addIntegerOption((option) =>
            option
              .setName(VAC_COMMAND.OPTION.LIMIT)
              .setDescription(limitValueDesc.ja)
              .setDescriptionLocalizations(limitValueDesc.localizations)
              .setRequired(true)
              .setMinValue(VAC_COMMAND.LIMIT_MIN)
              .setMaxValue(VAC_COMMAND.LIMIT_MAX),
          ),
      );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Guild外実行は機能対象外
      const guildId = interaction.guildId;
      if (!guildId) {
        throw new ValidationError(tDefault("errors:validation.guild_only"));
      }

      // 実行者が現在いるVCを取得し、VAC管理下か検証
      const voiceChannel = await getManagedVoiceChannel(interaction, guildId);
      const subcommand = interaction.options.getSubcommand();

      // サブコマンド別に処理を委譲
      // どの経路でも対象VCの検証は事前に1回だけ行う
      switch (subcommand) {
        case VAC_COMMAND.SUBCOMMAND.VC_RENAME:
          // 現在VC名を指定文字列へ更新
          await handleRename(interaction, guildId, voiceChannel.id);
          break;
        case VAC_COMMAND.SUBCOMMAND.VC_LIMIT:
          // 現在VCの userLimit を再設定
          await handleLimit(interaction, guildId, voiceChannel.id);
          break;
        default:
          throw new ValidationError(
            tDefault("errors:validation.invalid_subcommand"),
          );
      }
    } catch (error) {
      await handleCommandError(interaction, error);
    }
  },

  cooldown: 3,
};

/**
 * 実行者が参加中のVCがVAC管理下かを確認する
 */
async function getManagedVoiceChannel(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<{ id: string }> {
  // キャッシュ未命中でも確実に取得するため fetch を使用
  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const voiceChannel = member?.voice.channel;
  // 実行者本人の現在接続VCのみを操作対象に限定する

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_in_any_vc"),
    );
  }

  const isManaged = await isManagedVacChannel(guildId, voiceChannel.id);
  // VAC が管理していない通常VCでは本コマンドを拒否
  if (!isManaged) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  // 呼び出し側へ最小情報(id)のみ返し、利用箇所の責務を限定する
  return { id: voiceChannel.id };
}

/**
 * VC名変更処理
 */
async function handleRename(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  channelId: string,
): Promise<void> {
  // 新しい表示名（必須）を取得
  // 文字数上限は SlashCommand 定義側で担保済み
  const newName = interaction.options.getString(VAC_COMMAND.OPTION.NAME, true);
  const channel = await interaction.guild?.channels.fetch(channelId);
  // 実体が消えていた場合は安全側でエラー
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  await channel.edit({ name: newName });
  // 更新後の名前をそのまま成功文言へ反映
  // rename 操作はこの時点で完了し、追加副作用は持たない

  const embed = createSuccessEmbed(
    // 成功時は新しいVC名を差し込んだローカライズ文言を返す
    await tGuild(guildId, "commands:vac.embed.renamed", {
      name: newName,
    }),
  );
  // rename/limit ともに Ephemeral 返信で操作ノイズを抑える
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * 人数制限変更処理
 */
async function handleLimit(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  channelId: string,
): Promise<void> {
  // 設定対象の上限値（0は無制限）
  const limit = interaction.options.getInteger(VAC_COMMAND.OPTION.LIMIT, true);
  // limit は SlashCommand 側で整数保証済み
  // 実行時検証は不正経路・仕様変更時の防波堤として維持する

  // SlashCommand 側でも制約済みだが、実行時に再検証して安全側を維持
  if (limit < VAC_COMMAND.LIMIT_MIN || limit > VAC_COMMAND.LIMIT_MAX) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.limit_out_of_range"),
    );
  }

  const channel = await interaction.guild?.channels.fetch(channelId);
  // 対象VCが消失/型不一致なら更新せず終了
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  await channel.edit({ userLimit: limit });
  // userLimit 更新成功後にのみ結果メッセージを返す

  const limitLabel =
    // 0 の場合は「無制限」表記へ変換
    limit === 0
      ? await tGuild(guildId, "commands:vac.embed.unlimited")
      : String(limit);
  const embed = createSuccessEmbed(
    // 0 は "無制限" 表示、それ以外は数値文字列を埋め込む
    await tGuild(guildId, "commands:vac.embed.limit_changed", {
      limit: limitLabel,
    }),
  );
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

export default vacCommand;
