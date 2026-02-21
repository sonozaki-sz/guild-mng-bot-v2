// src/bot/features/ping/commands/pingCommand.execute.ts
// ping コマンド実行処理

import type { ChatInputCommandInteraction } from "discord.js";
import { tGuild } from "../../../../shared/locale/localeManager";
import { createSuccessEmbed } from "../../../utils/messageResponse";

const PING_I18N_KEYS = {
  EMBED_MEASURING: "commands:ping.embed.measuring",
  EMBED_RESPONSE: "commands:ping.embed.response",
} as const;

/**
 * ping コマンド実行入口
 * @param interaction コマンド実行インタラクション
 * @returns 実行完了を示す Promise
 */
export async function executePingCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildId = interaction.guildId ?? undefined;

  const measuring = await tGuild(guildId, PING_I18N_KEYS.EMBED_MEASURING);
  await interaction.reply({
    content: measuring,
  });
  const sent = await interaction.fetchReply();

  const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;
  const wsLatency = interaction.client.ws.ping;

  const description = await tGuild(guildId, PING_I18N_KEYS.EMBED_RESPONSE, {
    apiLatency,
    wsLatency,
  });

  const embed = createSuccessEmbed(description);

  await interaction.editReply({
    content: "",
    embeds: [embed],
  });
}
