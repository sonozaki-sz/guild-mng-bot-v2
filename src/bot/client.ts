// src/bot/client.ts
// Discord Client初期化

import { Client, Collection, GatewayIntentBits } from "discord.js";
import type { Command, Modal } from "../shared/types/discord";
import { logger } from "../shared/utils/logger";
import { CooldownManager } from "./services/CooldownManager";

export class BotClient extends Client {
  public commands: Collection<string, Command>;
  public modals: Collection<string, Modal>;
  public cooldownManager: CooldownManager;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    this.commands = new Collection();
    this.modals = new Collection();
    this.cooldownManager = new CooldownManager();
  }

  /**
   * クライアントを安全にシャットダウン
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down bot client...");
    this.cooldownManager.destroy();
    await this.destroy();
    logger.info("Bot client shut down successfully");
  }
}

export const createBotClient = (): BotClient => {
  const client = new BotClient();

  logger.info("Discord Botクライアントを初期化しました");

  return client;
};
