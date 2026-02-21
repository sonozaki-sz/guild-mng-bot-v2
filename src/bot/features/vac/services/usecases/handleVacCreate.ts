// src/bot/features/vac/services/usecases/handleVacCreate.ts
// VAC自動作成ユースケース

import {
  ChannelType,
  PermissionFlagsBits,
  type GuildMember,
  type VoiceState,
} from "discord.js";
import { tDefault } from "../../../../../shared/locale";
import { logger } from "../../../../../shared/utils";
import { sendVacControlPanel } from "../../handlers/ui";
import type { IVacRepository } from "../../repositories";

const VAC_EVENT = {
  DEFAULT_LIMIT: 99,
  CATEGORY_CHANNEL_LIMIT: 50,
} as const;

type GuildChannelsCache = GuildMember["guild"]["channels"]["cache"];

/**
 * トリガーVC参加時に管理対象VACを作成し、参加者を移動する
 * @param vacRepository VAC設定リポジトリ
 * @param newState 最新ボイス状態
 * @returns 実行完了
 */
export async function handleVacCreateUseCase(
  vacRepository: IVacRepository,
  newState: VoiceState,
): Promise<void> {
  const member = newState.member;
  const newChannel = newState.channel;
  if (!member || !newChannel || newChannel.type !== ChannelType.GuildVoice) {
    return;
  }

  const config = await vacRepository.getVacConfigOrDefault(member.guild.id);
  if (!config.enabled || !config.triggerChannelIds.includes(newChannel.id)) {
    return;
  }

  const existingOwnedChannel = config.createdChannels.find(
    (channel) => channel.ownerId === member.id,
  );
  if (existingOwnedChannel) {
    const ownedChannel = await member.guild.channels
      .fetch(existingOwnedChannel.voiceChannelId)
      .catch(() => null);
    if (ownedChannel?.type === ChannelType.GuildVoice) {
      await member.voice.setChannel(ownedChannel);
      return;
    }
    await vacRepository.removeCreatedVacChannel(
      member.guild.id,
      existingOwnedChannel.voiceChannelId,
    );
  }

  const parentCategory =
    newChannel.parent?.type === ChannelType.GuildCategory
      ? newChannel.parent
      : null;

  if (
    parentCategory &&
    parentCategory.children.cache.size >= VAC_EVENT.CATEGORY_CHANNEL_LIMIT
  ) {
    logger.warn(
      tDefault("system:vac.category_full", {
        guildId: member.guild.id,
        categoryId: parentCategory.id,
      }),
    );
    return;
  }

  const channelName = buildUniqueChannelName(
    member,
    member.guild.channels.cache,
  );
  const voiceChannel = await member.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildVoice,
    parent: parentCategory?.id ?? null,
    userLimit: VAC_EVENT.DEFAULT_LIMIT,
    permissionOverwrites: [
      {
        id: member.id,
        allow: [PermissionFlagsBits.ManageChannels],
      },
    ],
  });

  if (voiceChannel.type !== ChannelType.GuildVoice) {
    return;
  }

  await sendVacControlPanel(voiceChannel).catch((error) => {
    logger.error(tDefault("system:vac.panel_send_failed"), error);
  });

  await member.voice.setChannel(voiceChannel);

  await vacRepository.addCreatedVacChannel(member.guild.id, {
    voiceChannelId: voiceChannel.id,
    ownerId: member.id,
    createdAt: Date.now(),
  });

  logger.info(
    tDefault("system:vac.channel_created", {
      guildId: member.guild.id,
      channelId: voiceChannel.id,
      ownerId: member.id,
    }),
  );
}

/**
 * 既存チャンネル名と衝突しないVACチャンネル名を生成する
 * @param member VAC所有者となるメンバー
 * @param channels ギルド内チャンネルキャッシュ
 * @returns 一意化されたチャンネル名
 */
function buildUniqueChannelName(
  member: GuildMember,
  channels: GuildChannelsCache,
): string {
  const baseName = `${member.displayName}'s Room`;
  let channelName = baseName;
  let counter = 2;

  while (channels.find((channel) => channel.name === channelName)) {
    channelName = `${baseName} (${counter})`;
    counter += 1;
  }

  return channelName;
}
