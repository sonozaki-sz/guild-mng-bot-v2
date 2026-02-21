// src/bot/features/afk/commands/afkConfigCommand.execute.ts
// afk-config コマンド実行処理

import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { ValidationError } from "../../../../shared/errors";
import { tDefault, tGuild } from "../../../../shared/locale";
import { logger } from "../../../../shared/utils";
import { getBotGuildConfigRepository } from "../../../services/botGuildConfigRepositoryResolver";
import {
  createInfoEmbed,
  createSuccessEmbed,
} from "../../../utils/messageResponse";

const AFK_CONFIG_SUBCOMMAND = {
  SET_CHANNEL: "set-ch",
  SHOW: "show",
} as const;

/**
 * afk-config コマンド実行入口
 */
export async function executeAfkConfigCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case AFK_CONFIG_SUBCOMMAND.SET_CHANNEL:
      await handleSetChannel(interaction, guildId);
      break;
    case AFK_CONFIG_SUBCOMMAND.SHOW:
      await handleShowSetting(interaction, guildId);
      break;
    default:
      throw new ValidationError(
        tDefault("errors:validation.invalid_subcommand"),
      );
  }
}

async function handleSetChannel(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const channel = interaction.options.getChannel("channel", true);

  if (channel.type !== ChannelType.GuildVoice) {
    throw new ValidationError(
      await tGuild(guildId, "errors:afk.invalid_channel_type"),
    );
  }

  await getBotGuildConfigRepository().setAfkChannel(guildId, channel.id);

  const description = await tGuild(
    guildId,
    "commands:afk-config.embed.set_ch_success",
    {
      channel: `<#${channel.id}>`,
    },
  );

  const embed = createSuccessEmbed(description);

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  logger.info(
    tDefault("system:afk.configured_log", { guildId, channelId: channel.id }),
  );
}

async function handleShowSetting(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const config = await getBotGuildConfigRepository().getAfkConfig(guildId);

  const title = await tGuild(guildId, "commands:afk-config.embed.title");

  if (!config || !config.enabled || !config.channelId) {
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
      { name: fieldChannel, value: `<#${config.channelId}>`, inline: true },
    ],
  });

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
