// src/bot/features/vac/services/usecases/cleanupVacOnStartup.ts
// VAC起動時クリーンアップユースケース

import { ChannelType } from "discord.js";
import type { BotClient } from "../../../../client";
import type { IVacRepository } from "../../repositories/vacRepository";

/**
 * 起動時に不整合なトリガー/作成済みVACチャンネル情報を掃除する
 * @param vacRepository VAC設定リポジトリ
 * @param client Botクライアント
 * @returns 実行完了
 */
export async function cleanupVacOnStartupUseCase(
  vacRepository: IVacRepository,
  client: BotClient,
): Promise<void> {
  for (const [, guild] of client.guilds.cache) {
    const vacConfig = await vacRepository.getVacConfigOrDefault(guild.id);

    for (const triggerChannelId of vacConfig.triggerChannelIds) {
      const triggerChannel = await guild.channels
        .fetch(triggerChannelId)
        .catch(() => null);

      if (!triggerChannel || triggerChannel.type !== ChannelType.GuildVoice) {
        await vacRepository.removeTriggerChannel(guild.id, triggerChannelId);
      }
    }

    for (const channelInfo of vacConfig.createdChannels) {
      const channel = await guild.channels
        .fetch(channelInfo.voiceChannelId)
        .catch(() => null);

      if (!channel) {
        await vacRepository.removeCreatedVacChannel(
          guild.id,
          channelInfo.voiceChannelId,
        );
        continue;
      }

      if (channel.isDMBased() || channel.type !== ChannelType.GuildVoice) {
        await vacRepository.removeCreatedVacChannel(
          guild.id,
          channelInfo.voiceChannelId,
        );
        continue;
      }

      if (channel.members.size === 0) {
        await channel.delete().catch(() => null);
        await vacRepository.removeCreatedVacChannel(
          guild.id,
          channelInfo.voiceChannelId,
        );
      }
    }
  }
}
