// src/bot/features/vac/handlers/ui/vacControlPanel.ts
// VAC操作パネルの送信ユーティリティ

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type VoiceChannel,
} from "discord.js";
import { tGuild } from "../../../../../shared/locale";
import { createInfoEmbed } from "../../../../utils/messageResponse";

// VAC パネルのボタン/モーダル/入力識別に使う customId 定数
export const VAC_PANEL_CUSTOM_ID = {
  RENAME_BUTTON_PREFIX: "vac:rename:",
  LIMIT_BUTTON_PREFIX: "vac:limit:",
  AFK_BUTTON_PREFIX: "vac:afk:",
  REFRESH_BUTTON_PREFIX: "vac:refresh:",
  RENAME_MODAL_PREFIX: "vac:rename-modal:",
  LIMIT_MODAL_PREFIX: "vac:limit-modal:",
  AFK_SELECT_PREFIX: "vac:afk-select:",
  RENAME_INPUT: "vac:rename-input",
  LIMIT_INPUT: "vac:limit-input",
} as const;

/**
 * VAC パネル customId から対象ボイスチャンネル ID を抽出する関数
 * @param customId 判定対象の customId
 * @param prefix 対象とする customId プレフィックス
 * @returns 解決したチャンネルID（不一致時は空文字）
 */
export function getVacPanelChannelId(customId: string, prefix: string): string {
  // 想定prefix以外は空文字を返し、呼び出し側で不正IDとして扱う
  // 例外を投げず空文字へ寄せることで UI ハンドラ側の分岐を単純化する
  return customId.startsWith(prefix) ? customId.slice(prefix.length) : "";
}

/**
 * VAC 操作パネルメッセージを対象ボイスチャンネルへ送信する関数
 * @param voiceChannel 送信先ボイスチャンネル
 * @returns 実行完了を示す Promise
 */
export async function sendVacControlPanel(
  voiceChannel: VoiceChannel,
): Promise<void> {
  // VoiceChannel でも send 不可な状態（権限不足など）は送信しない
  if (!voiceChannel.isTextBased() || !voiceChannel.isSendable()) {
    return;
  }

  const guildId = voiceChannel.guild.id;
  // 表示文言は送信先 guild のロケールで都度解決
  const title = await tGuild(guildId, "commands:vac.panel.title");
  const description = await tGuild(guildId, "commands:vac.panel.description");

  const renameLabel = await tGuild(guildId, "commands:vac.panel.rename_button");
  const limitLabel = await tGuild(guildId, "commands:vac.panel.limit_button");
  const afkLabel = await tGuild(guildId, "commands:vac.panel.afk_button");
  const refreshLabel = await tGuild(
    guildId,
    "commands:vac.panel.refresh_button",
  );

  // 操作説明付きの固定Embedを作成
  const embed = createInfoEmbed(description, { title });

  // 1行1ボタン構成で操作ごとの customId を明確化
  // ボタン行を分けることで誤タップ時の視認性を高める
  const renameRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `${VAC_PANEL_CUSTOM_ID.RENAME_BUTTON_PREFIX}${voiceChannel.id}`,
      )
      .setLabel(renameLabel)
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Primary),
  );

  const limitRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `${VAC_PANEL_CUSTOM_ID.LIMIT_BUTTON_PREFIX}${voiceChannel.id}`,
      )
      .setLabel(limitLabel)
      .setEmoji("👥")
      .setStyle(ButtonStyle.Primary),
  );

  const afkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${VAC_PANEL_CUSTOM_ID.AFK_BUTTON_PREFIX}${voiceChannel.id}`)
      .setLabel(afkLabel)
      .setEmoji("🔇")
      .setStyle(ButtonStyle.Primary),
  );

  const refreshRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    // refresh は同一VCにパネルを再送して最新位置へ移動させる
    new ButtonBuilder()
      .setCustomId(
        `${VAC_PANEL_CUSTOM_ID.REFRESH_BUTTON_PREFIX}${voiceChannel.id}`,
      )
      .setLabel(refreshLabel)
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Primary),
  );

  // パネル本体を送信（後続操作は interaction ハンドラー側で処理）
  // 送信順（rename→limit→afk→refresh）は UI 説明順と一致させる
  await voiceChannel.send({
    embeds: [embed],
    components: [renameRow, limitRow, afkRow, refreshRow],
  });
}
