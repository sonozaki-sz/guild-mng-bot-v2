// src/bot/features/vac/commands/vacCommand.execute.ts
// VAC コマンド実行処理

import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { ValidationError } from "../../../../shared/errors";
import { isManagedVacChannel } from "../../../../shared/features/vac";
import { tDefault, tGuild } from "../../../../shared/locale";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { createSuccessEmbed } from "../../../utils/messageResponse";
import { VAC_COMMAND } from "./vacCommand.constants";

/**
 * vac コマンド実行入口
 * @param interaction コマンド実行インタラクション
 * @returns 実行完了を示す Promise
 */
export async function executeVacCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    // Guild 外実行は対象外
    const guildId = interaction.guildId;
    if (!guildId) {
      throw new ValidationError(tDefault("errors:validation.guild_only"));
    }

    // 実行者が操作可能な VAC 管理VCかを先に確定
    const voiceChannel = await getManagedVoiceChannel(interaction, guildId);
    const subcommand = interaction.options.getSubcommand();

    // サブコマンド別に更新処理を分岐
    switch (subcommand) {
      case VAC_COMMAND.SUBCOMMAND.VC_RENAME:
        await handleRename(interaction, guildId, voiceChannel.id);
        break;
      case VAC_COMMAND.SUBCOMMAND.VC_LIMIT:
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
}

/**
 * 実行者が参加中のVCがVAC管理下かを確認する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 管理対象VCの最小情報
 */
async function getManagedVoiceChannel(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<{ id: string }> {
  // 実行者の現在接続VCを取得
  const member = await interaction.guild?.members.fetch(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_in_any_vc"),
    );
  }

  const isManaged = await isManagedVacChannel(guildId, voiceChannel.id);
  if (!isManaged) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  return { id: voiceChannel.id };
}

/**
 * VC名変更処理
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @param channelId 変更対象VCのチャンネルID
 * @returns 実行完了を示す Promise
 */
async function handleRename(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  channelId: string,
): Promise<void> {
  // 入力値と対象チャンネルを解決して更新可能か検証
  const newName = interaction.options.getString(VAC_COMMAND.OPTION.NAME, true);
  const channel = await interaction.guild?.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  await channel.edit({ name: newName });

  // 更新結果を操作者へ通知
  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac.embed.renamed", {
      name: newName,
    }),
  );
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * 人数制限変更処理
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @param channelId 変更対象VCのチャンネルID
 * @returns 実行完了を示す Promise
 */
async function handleLimit(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  channelId: string,
): Promise<void> {
  // 入力上限値を取得し、許容範囲を検証
  const limit = interaction.options.getInteger(VAC_COMMAND.OPTION.LIMIT, true);

  if (limit < VAC_COMMAND.LIMIT_MIN || limit > VAC_COMMAND.LIMIT_MAX) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.limit_out_of_range"),
    );
  }

  const channel = await interaction.guild?.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.not_vac_channel"),
    );
  }

  await channel.edit({ userLimit: limit });

  // 0 は無制限ラベルに変換して結果を返す
  const limitLabel =
    limit === 0
      ? await tGuild(guildId, "commands:vac.embed.unlimited")
      : String(limit);
  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac.embed.limit_changed", {
      limit: limitLabel,
    }),
  );
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
