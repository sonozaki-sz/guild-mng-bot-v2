// src/shared/database/repositories/GuildConfigRepository.ts
// Repositoryパターン実装
// REFACTORING_PLAN.md Phase 3 準拠

import KeyvSqlite from "@keyv/sqlite";
import Keyv from "keyv";
import { DatabaseError } from "../../errors/CustomErrors";
import { logger } from "../../utils/logger";

/**
 * Guild設定の型定義
 */
export interface GuildConfig {
  guildId: string;
  locale: string; // Phase 3.3: Guild別言語対応
  afkConfig?: AfkConfig;
  profChannelConfig?: ProfChannelConfig;
  vacConfig?: VacConfig;
  bumpReminderConfig?: BumpReminderConfig;
  stickMessages?: StickMessage[];
  leaveMemberLogConfig?: LeaveMemberLogConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AfkConfig {
  enabled: boolean;
  channelId?: string;
}

export interface ProfChannelConfig {
  enabled: boolean;
  channelId?: string;
}

export interface VacConfig {
  enabled: boolean;
  triggerChannelId?: string;
  destCategoryId?: string;
  createdChannels: { voiceChannelId: string; textChannelId?: string }[];
}

export interface BumpReminderConfig {
  enabled: boolean;
  mentionRoleId?: string;
  remindDate?: number;
  mentionUserIds: string[];
}

export interface StickMessage {
  channelId: string;
  messageId: string;
}

export interface LeaveMemberLogConfig {
  channelId?: string;
}

/**
 * Repositoryインターフェース
 */
export interface IGuildConfigRepository {
  getConfig(guildId: string): Promise<GuildConfig | null>;
  saveConfig(config: GuildConfig): Promise<void>;
  updateConfig(guildId: string, updates: Partial<GuildConfig>): Promise<void>;
  deleteConfig(guildId: string): Promise<void>;
  exists(guildId: string): Promise<boolean>;
  getLocale(guildId: string): Promise<string>;
  updateLocale(guildId: string, locale: string): Promise<void>;
  getAfkConfig(guildId: string): Promise<AfkConfig | null>;
  updateAfkConfig(guildId: string, afkConfig: AfkConfig): Promise<void>;
  getBumpReminderConfig(guildId: string): Promise<BumpReminderConfig | null>;
  updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void>;
  getVacConfig(guildId: string): Promise<VacConfig | null>;
  updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void>;
  getStickMessages(guildId: string): Promise<StickMessage[]>;
  updateStickMessages(
    guildId: string,
    stickMessages: StickMessage[],
  ): Promise<void>;
}

/**
 * Keyv実装のRepository
 */
export class KeyvGuildConfigRepository implements IGuildConfigRepository {
  private keyv: Keyv;
  private readonly DEFAULT_LOCALE = "ja";

  constructor(connectionString: string) {
    const store = new KeyvSqlite(connectionString);
    this.keyv = new Keyv({ store });

    this.keyv.on("error", (err) => {
      logger.error("Keyv connection error:", err);
      throw new DatabaseError("Database connection failed");
    });
  }

  /**
   * Guild設定を取得
   */
  async getConfig(guildId: string): Promise<GuildConfig | null> {
    try {
      const config = await this.keyv.get(`guild:${guildId}`);

      if (!config) {
        return null;
      }

      // Date型への変換
      return {
        ...config,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt),
      };
    } catch (error) {
      logger.error(`Failed to get config for guild ${guildId}:`, error);
      throw new DatabaseError(
        `Failed to get guild config: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  /**
   * Guild設定を保存（新規作成）
   */
  async saveConfig(config: GuildConfig): Promise<void> {
    try {
      const now = new Date();
      const configData = {
        ...config,
        locale: config.locale || this.DEFAULT_LOCALE,
        createdAt: config.createdAt || now,
        updatedAt: now,
      };

      await this.keyv.set(`guild:${config.guildId}`, configData);
      logger.info(`Saved config for guild ${config.guildId}`);
    } catch (error) {
      logger.error(`Failed to save config for guild ${config.guildId}:`, error);
      throw new DatabaseError(
        `Failed to save guild config: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  /**
   * Guild設定を更新
   */
  async updateConfig(
    guildId: string,
    updates: Partial<GuildConfig>,
  ): Promise<void> {
    try {
      const existing = await this.getConfig(guildId);

      if (!existing) {
        // 存在しない場合は新規作成
        await this.saveConfig({
          guildId,
          locale: this.DEFAULT_LOCALE,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...updates,
        });
        return;
      }

      const updated = {
        ...existing,
        ...updates,
        guildId, // guildIdは変更不可
        updatedAt: new Date(),
      };

      await this.keyv.set(`guild:${guildId}`, updated);
      logger.info(`Updated config for guild ${guildId}`);
    } catch (error) {
      logger.error(`Failed to update config for guild ${guildId}:`, error);
      throw new DatabaseError(
        `Failed to update guild config: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  /**
   * Guild設定を削除
   */
  async deleteConfig(guildId: string): Promise<void> {
    try {
      await this.keyv.delete(`guild:${guildId}`);
      logger.info(`Deleted config for guild ${guildId}`);
    } catch (error) {
      logger.error(`Failed to delete config for guild ${guildId}:`, error);
      throw new DatabaseError(
        `Failed to delete guild config: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  /**
   * Guild設定の存在確認
   */
  async exists(guildId: string): Promise<boolean> {
    try {
      const config = await this.keyv.get(`guild:${guildId}`);
      return config !== undefined && config !== null;
    } catch (error) {
      logger.error(`Failed to check existence for guild ${guildId}:`, error);
      return false;
    }
  }

  /**
   * 機能別の便利メソッド
   */

  async getAfkConfig(guildId: string): Promise<AfkConfig | null> {
    const config = await this.getConfig(guildId);
    return config?.afkConfig || null;
  }

  async updateAfkConfig(guildId: string, afkConfig: AfkConfig): Promise<void> {
    await this.updateConfig(guildId, { afkConfig });
  }

  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    const config = await this.getConfig(guildId);
    return config?.bumpReminderConfig || null;
  }

  async updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void> {
    await this.updateConfig(guildId, { bumpReminderConfig });
  }

  async getVacConfig(guildId: string): Promise<VacConfig | null> {
    const config = await this.getConfig(guildId);
    return config?.vacConfig || null;
  }

  async updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void> {
    await this.updateConfig(guildId, { vacConfig });
  }

  async getStickMessages(guildId: string): Promise<StickMessage[]> {
    const config = await this.getConfig(guildId);
    return config?.stickMessages || [];
  }

  async updateStickMessages(
    guildId: string,
    stickMessages: StickMessage[],
  ): Promise<void> {
    await this.updateConfig(guildId, { stickMessages });
  }

  /**
   * Guild別言語取得（Phase 3.3）
   */
  async getLocale(guildId: string): Promise<string> {
    const config = await this.getConfig(guildId);
    return config?.locale || this.DEFAULT_LOCALE;
  }

  async updateLocale(guildId: string, locale: string): Promise<void> {
    await this.updateConfig(guildId, { locale });
  }
}

/**
 * Repositoryインスタンス作成
 */
export const createGuildConfigRepository = (
  databaseUrl: string,
): IGuildConfigRepository => {
  return new KeyvGuildConfigRepository(databaseUrl);
};
