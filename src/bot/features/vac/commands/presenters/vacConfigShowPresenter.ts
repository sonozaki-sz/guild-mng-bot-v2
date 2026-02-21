// src/bot/features/vac/commands/presenters/vacConfigShowPresenter.ts
// vac-config show 用の表示整形

import { ChannelType, type Guild } from "discord.js";
import type { VacConfig } from "../../../../../shared/database";
import { tGuild } from "../../../../../shared/locale";

export interface VacConfigShowPresentation {
  title: string;
  fieldTrigger: string;
  triggerChannels: string;
  fieldCreatedDetails: string;
  createdVcDetails: string;
}

/**
 * vac-config show の表示内容を整形する
 */
export async function presentVacConfigShow(
  guild: Guild,
  guildId: string,
  config: VacConfig,
): Promise<VacConfigShowPresentation> {
  const topLabel = await tGuild(guildId, "commands:vac-config.embed.top");

  const triggerChannels =
    config.triggerChannelIds.length > 0
      ? (
          await Promise.all(
            config.triggerChannelIds.map(async (id) => {
              const channel = await guild.channels.fetch(id).catch(() => null);
              const categoryLabel =
                channel?.parent?.type === ChannelType.GuildCategory
                  ? channel.parent.name
                  : topLabel;
              return `<#${id}> (${categoryLabel})`;
            }),
          )
        ).join("\n")
      : await tGuild(guildId, "commands:vac-config.embed.not_configured");

  const createdVcDetails =
    config.createdChannels.length > 0
      ? config.createdChannels
          .map((item) => `<#${item.voiceChannelId}>(<@${item.ownerId}>)`)
          .join("\n")
      : await tGuild(guildId, "commands:vac-config.embed.no_created_vcs");

  const title = await tGuild(guildId, "commands:vac-config.embed.title");
  const fieldTrigger = await tGuild(
    guildId,
    "commands:vac-config.embed.field.trigger_channels",
  );
  const fieldCreatedDetails = await tGuild(
    guildId,
    "commands:vac-config.embed.field.created_vc_details",
  );

  return {
    title,
    fieldTrigger,
    triggerChannels,
    fieldCreatedDetails,
    createdVcDetails,
  };
}
