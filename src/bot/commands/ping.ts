// src/bot/commands/ping.ts
// Pingコマンド - ボットの応答速度を確認

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../bot/types/discord";
import { createSuccessEmbed } from "../../bot/utils/messageResponse";
import {
  getCommandLocalizations,
  tGuild
} from "../services/shared-access";
import {
  handleCommandError
} from "../services/shared-access";

// Ping コマンドで使用するコマンド名定数
const PING_COMMAND = {
  NAME: "ping",
} as const;

// Ping コマンドの表示文言キーを管理する定数
const PING_I18N_KEYS = {
  COMMAND_DESCRIPTION: "ping.description",
  EMBED_MEASURING: "commands:ping.embed.measuring",
  EMBED_RESPONSE: "commands:ping.embed.response",
} as const;

/**
 * Pingコマンド
 * ボットのレイテンシー（応答速度）を確認する
 */
export const pingCommand: Command = {
  data: (() => {
    const desc = getCommandLocalizations(PING_I18N_KEYS.COMMAND_DESCRIPTION);
    return new SlashCommandBuilder()
      .setName(PING_COMMAND.NAME)
      .setDescription(desc.ja)
      .setDescriptionLocalizations(desc.localizations);
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // DM実行でも共通翻訳APIを使えるよう guildId は optional 扱い
      const guildId = interaction.guildId ?? undefined;

      // 初回応答（タイムスタンプ計測用）
      const measuring = await tGuild(guildId, PING_I18N_KEYS.EMBED_MEASURING);
      await interaction.reply({
        content: measuring,
      });
      const sent = await interaction.fetchReply();

      // レイテンシー計算
      // API遅延: コマンド受信〜返信メッセージ生成
      const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;
      // WebSocket遅延: Discord Gateway 往復
      const wsLatency = interaction.client.ws.ping;

      // 結果をEmbedで表示
      const description = await tGuild(guildId, PING_I18N_KEYS.EMBED_RESPONSE, {
        apiLatency,
        wsLatency,
      });

      const embed = createSuccessEmbed(description);

      await interaction.editReply({
        // 計測中テキストを消して Embed のみ表示
        content: "",
        embeds: [embed],
      });
    } catch (error) {
      await handleCommandError(interaction, error);
    }
  },

  cooldown: 5,
};
