// src/shared/types/discord.ts
// Discord関連の型定義

import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ClientEvents,
  Collection,
  ModalBuilder,
  ModalSubmitInteraction,
  SharedSlashCommand,
} from "discord.js";

/**
 * スラッシュコマンドインターフェース
 */
export interface Command {
  /** コマンドデータ */
  data: SharedSlashCommand;

  /** コマンド実行関数 */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;

  /** オートコンプリート関数（オプション） */
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;

  /** クールダウン時間（秒）（オプション） */
  cooldown?: number;
}

/**
 * モーダルインターフェース
 */
export interface Modal {
  /** モーダルビルダー */
  modal: ModalBuilder;

  /** 追加データ（オプション） */
  data?: unknown;

  /** モーダル送信時の実行関数 */
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
}

/**
 * Botイベントインターフェース
 */
export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  /** イベント名 */
  name: K;

  /** 一度だけ実行するか */
  once?: boolean;

  /** イベント実行関数 */
  execute: (...args: ClientEvents[K]) => Promise<void>;
}

/**
 * Discord.js Client の型拡張
 */
declare module "discord.js" {
  interface Client {
    /** 登録されたコマンド */
    commands: Collection<string, Command>;

    /** クールダウン管理 */
    cooldowns: Collection<string, number>;

    /** 登録されたモーダル */
    modals: Collection<string, Modal>;
  }
}
