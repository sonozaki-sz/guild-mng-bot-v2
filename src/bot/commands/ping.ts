// src/bot/commands/ping.ts
// Pingコマンド - ボットの応答速度を確認

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { handleCommandError } from "../../shared/errors/ErrorHandler";
import { t } from "../../shared/locale";
import { getCommandLocalizations } from "../../shared/locale/commandLocalizations";
import type { Command } from "../../shared/types/discord";

/**
 * Pingコマンド
 * ボットのレイテンシー（応答速度）を確認する
 */
export const pingCommand: Command = {
  data: (() => {
    const desc = getCommandLocalizations("ping.description");
    return new SlashCommandBuilder()
      .setName("ping")
      .setDescription(desc.ja)
      .setDescriptionLocalizations(desc.localizations);
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const guildId = interaction.guildId ?? undefined;

      // 初回応答（タイムスタンプ計測用）
      const measuring = await t(guildId, "commands:ping.measuring");
      const sent = await interaction.reply({
        content: measuring,
        fetchReply: true,
      });

      // レイテンシー計算
      const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;
      const wsLatency = interaction.client.ws.ping;

      // 結果を編集して表示
      const result = await t(guildId, "commands:ping.result", {
        apiLatency,
        wsLatency,
      });

      await interaction.editReply({
        content: result,
      });
    } catch (error) {
      await handleCommandError(interaction, error as Error);
    }
  },

  cooldown: 5,
};
