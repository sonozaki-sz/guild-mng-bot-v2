// src/bot/client.ts
// Discord Client初期化

import { Client, Collection, GatewayIntentBits } from "discord.js";
import { tDefault } from "../shared/locale";
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
    logger.info(tDefault("system:bot.client.shutting_down"));
    this.cooldownManager.destroy();
    await this.destroy();
    logger.info(tDefault("system:bot.client.shutdown_complete"));
  }
}

export const createBotClient = (): BotClient => {
  const client = new BotClient();

  logger.info(tDefault("system:bot.client.initialized"));

  return client;
};
