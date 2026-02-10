// src/shared/database/repositories/GuildConfigRepository.ts
// Repositoryパターン実装（Prisma版）
// REFACTORING_PLAN.md Phase 3 準拠

import { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../errors/CustomErrors";
import { tDefault } from "../../locale";
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
  joinLeaveLogConfig?: JoinLeaveLogConfig;
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

export interface JoinLeaveLogConfig {
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
 * Prisma実装のRepository
 */
export class PrismaGuildConfigRepository implements IGuildConfigRepository {
  private prisma: PrismaClient;
  private readonly DEFAULT_LOCALE = "ja";

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Guild設定を取得
   */
  async getConfig(guildId: string): Promise<GuildConfig | null> {
    try {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
      });

      if (!record) {
        return null;
      }

      return this.recordToConfig(record);
    } catch (error) {
      logger.error(
        tDefault("system:database.get_config_log", { guildId }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.get_config_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
      );
    }
  }

  /**
   * Guild設定を保存（新規作成）
   */
  async saveConfig(config: GuildConfig): Promise<void> {
    try {
      await this.prisma.guildConfig.create({
        data: {
          guildId: config.guildId,
          locale: config.locale || this.DEFAULT_LOCALE,
          afkConfig: config.afkConfig ? JSON.stringify(config.afkConfig) : null,
          profChannelConfig: config.profChannelConfig
            ? JSON.stringify(config.profChannelConfig)
            : null,
          vacConfig: config.vacConfig ? JSON.stringify(config.vacConfig) : null,
          bumpReminderConfig: config.bumpReminderConfig
            ? JSON.stringify(config.bumpReminderConfig)
            : null,
          stickMessages: config.stickMessages
            ? JSON.stringify(config.stickMessages)
            : null,
          joinLeaveLogConfig: config.joinLeaveLogConfig
            ? JSON.stringify(config.joinLeaveLogConfig)
            : null,
        },
      });

      logger.info(
        tDefault("system:database.saved_config", { guildId: config.guildId }),
      );
    } catch (error) {
      logger.error(
        tDefault("system:database.save_config_log", {
          guildId: config.guildId,
        }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.save_config_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
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
      const existing = await this.exists(guildId);

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

      // 更新データの準備
      const data: Record<string, unknown> = {};

      if (updates.locale !== undefined) data.locale = updates.locale;
      if (updates.afkConfig !== undefined)
        data.afkConfig = JSON.stringify(updates.afkConfig);
      if (updates.profChannelConfig !== undefined)
        data.profChannelConfig = JSON.stringify(updates.profChannelConfig);
      if (updates.vacConfig !== undefined)
        data.vacConfig = JSON.stringify(updates.vacConfig);
      if (updates.bumpReminderConfig !== undefined)
        data.bumpReminderConfig = JSON.stringify(updates.bumpReminderConfig);
      if (updates.stickMessages !== undefined)
        data.stickMessages = JSON.stringify(updates.stickMessages);
      if (updates.joinLeaveLogConfig !== undefined)
        data.joinLeaveLogConfig = JSON.stringify(updates.joinLeaveLogConfig);

      await this.prisma.guildConfig.update({
        where: { guildId },
        data,
      });

      logger.info(tDefault("system:database.updated_config", { guildId }));
    } catch (error) {
      logger.error(
        tDefault("system:database.update_config_log", { guildId }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.update_config_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
      );
    }
  }

  /**
   * Guild設定を削除
   */
  async deleteConfig(guildId: string): Promise<void> {
    try {
      await this.prisma.guildConfig.delete({
        where: { guildId },
      });

      logger.info(tDefault("system:database.deleted_config", { guildId }));
    } catch (error) {
      logger.error(
        tDefault("system:database.delete_config_log", { guildId }),
        error,
      );
      throw new DatabaseError(
        `${tDefault("errors:database.delete_config_failed")}: ${error instanceof Error ? error.message : tDefault("errors:database.unknown_error")}`,
      );
    }
  }

  /**
   * Guild設定の存在確認
   */
  async exists(guildId: string): Promise<boolean> {
    try {
      const count = await this.prisma.guildConfig.count({
        where: { guildId },
      });
      return count > 0;
    } catch (error) {
      logger.error(
        tDefault("system:database.check_existence_log", { guildId }),
        error,
      );
      return false;
    }
  }

  /**
   * Guild別言語取得
   */
  async getLocale(guildId: string): Promise<string> {
    const config = await this.getConfig(guildId);
    return config?.locale || this.DEFAULT_LOCALE;
  }

  /**
   * Guild別言語更新
   */
  async updateLocale(guildId: string, locale: string): Promise<void> {
    await this.updateConfig(guildId, { locale });
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
   * PrismaレコードをGuildConfigに変換
   */
  private recordToConfig(record: {
    id: string;
    guildId: string;
    locale: string;
    afkConfig: string | null;
    profChannelConfig: string | null;
    vacConfig: string | null;
    bumpReminderConfig: string | null;
    stickMessages: string | null;
    joinLeaveLogConfig: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): GuildConfig {
    return {
      guildId: record.guildId,
      locale: record.locale,
      afkConfig: record.afkConfig
        ? (JSON.parse(record.afkConfig) as AfkConfig)
        : undefined,
      profChannelConfig: record.profChannelConfig
        ? (JSON.parse(record.profChannelConfig) as ProfChannelConfig)
        : undefined,
      vacConfig: record.vacConfig
        ? (JSON.parse(record.vacConfig) as VacConfig)
        : undefined,
      bumpReminderConfig: record.bumpReminderConfig
        ? (JSON.parse(record.bumpReminderConfig) as BumpReminderConfig)
        : undefined,
      stickMessages: record.stickMessages
        ? (JSON.parse(record.stickMessages) as StickMessage[])
        : undefined,
      joinLeaveLogConfig: record.joinLeaveLogConfig
        ? (JSON.parse(record.joinLeaveLogConfig) as JoinLeaveLogConfig)
        : undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

/**
 * Repositoryインスタンス作成
 */
export const createGuildConfigRepository = (
  prisma: PrismaClient,
): IGuildConfigRepository => {
  return new PrismaGuildConfigRepository(prisma);
};
