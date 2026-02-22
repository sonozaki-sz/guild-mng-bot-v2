// src/bot/handlers/interactionCreate/ui/types.ts
// UI interaction ハンドラ型定義

import type {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from "discord.js";

export interface ButtonHandler {
  // customId がこのハンドラ対象かを判定
  matches: (customId: string) => boolean;
  // 対象ボタン interaction の処理本体
  execute: (interaction: ButtonInteraction) => Promise<void>;
}

export interface ModalHandler {
  // customId がこのハンドラ対象かを判定
  matches: (customId: string) => boolean;
  // 対象モーダル送信 interaction の処理本体
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

export interface UserSelectHandler {
  // customId がこのハンドラ対象かを判定
  matches: (customId: string) => boolean;
  // 対象ユーザー選択 interaction の処理本体
  execute: (interaction: UserSelectMenuInteraction) => Promise<void>;
}

export interface StringSelectHandler {
  // customId がこのハンドラ対象かを判定
  matches: (customId: string) => boolean;
  // 対象文字列選択 interaction の処理本体
  execute: (interaction: StringSelectMenuInteraction) => Promise<void>;
}
