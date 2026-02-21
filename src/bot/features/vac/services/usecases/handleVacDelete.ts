import { ChannelType, type VoiceState } from "discord.js";
import { tDefault } from "../../../../../shared/locale";
import { logger } from "../../../../../shared/utils";
import type { IVacRepository } from "../../repositories";

export async function handleVacDeleteUseCase(
  vacRepository: IVacRepository,
  oldState: VoiceState,
): Promise<void> {
  const oldChannel = oldState.channel;
  if (!oldChannel || oldChannel.type !== ChannelType.GuildVoice) {
    return;
  }

  const config = await vacRepository.getVacConfigOrDefault(oldChannel.guild.id);
  const isManaged = config.createdChannels.some(
    (channel) => channel.voiceChannelId === oldChannel.id,
  );

  if (!isManaged || oldChannel.members.size > 0) {
    return;
  }

  await oldChannel.delete().catch(() => null);
  await vacRepository.removeCreatedVacChannel(
    oldChannel.guild.id,
    oldChannel.id,
  );

  logger.info(
    tDefault("system:vac.channel_deleted", {
      guildId: oldChannel.guild.id,
      channelId: oldChannel.id,
    }),
  );
}
