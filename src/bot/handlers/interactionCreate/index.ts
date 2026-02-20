// src/bot/handlers/interactionCreate/index.ts
// interactionCreate のユースケース処理エントリ

import type { Interaction } from "discord.js";
import type { BotClient } from "../../client";
import {
  handleAutocomplete,
  handleButton,
  handleChatInputCommand,
  handleModalSubmit,
  handleUserSelectMenu,
} from "./flow";

/**
 * interactionCreate を種別ごとのフローへ振り分ける入口関数
 */
export async function handleInteractionCreate(
  interaction: Interaction,
): Promise<void> {
  // BotClient 拡張プロパティ（commands / cooldownManager）を利用するためキャスト
  const client = interaction.client as BotClient;

  // 種別は相互排他なので、最初に一致した分岐で早期 return する
  // スラッシュコマンド実行
  if (interaction.isChatInputCommand()) {
    await handleChatInputCommand(interaction, client);
    return;
  }

  // オートコンプリート応答
  if (interaction.isAutocomplete()) {
    await handleAutocomplete(interaction, client);
    return;
  }

  // モーダル送信（レジストリ処理）
  if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction);
    return;
  }

  // ボタン interaction
  if (interaction.isButton()) {
    await handleButton(interaction);
    return;
  }

  // ユーザーセレクト menu
  if (interaction.isUserSelectMenu()) {
    await handleUserSelectMenu(interaction);
  }

  // 未対応 interaction 種別は何もせず終了
}
