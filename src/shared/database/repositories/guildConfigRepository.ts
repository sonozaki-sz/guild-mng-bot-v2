// src/shared/database/repositories/guildConfigRepository.ts
// Repositoryパターン実装（Prisma版）

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../errors";
import { GuildAfkConfigStore } from "../stores/guildAfkConfigStore";
import { GuildBumpReminderConfigStore } from "../stores/guildBumpReminderConfigStore";
import { GuildMemberLogConfigStore } from "../stores/guildMemberLogConfigStore";
import { GuildStickMessageStore } from "../stores/guildStickMessageStore";
import { GuildVacConfigStore } from "../stores/guildVacConfigStore";
import type {
  AfkConfig,
  BumpReminderConfig,
  BumpReminderMentionClearResult,
  BumpReminderMentionRoleResult,
  BumpReminderMentionUserAddResult,
  BumpReminderMentionUserRemoveResult,
  BumpReminderMentionUsersClearResult,
  GuildConfig,
  IGuildConfigRepository,
  MemberLogConfig,
  StickMessage,
  VacConfig,
} from "../types";
import {
  existsGuildConfigRecord,
  findGuildConfigRecord,
  findGuildLocale,
} from "./persistence/guildConfigReadPersistence";
import {
  createGuildConfigRecord,
  deleteGuildConfigRecord,
  upsertGuildConfigRecord,
} from "./persistence/guildConfigWritePersistence";
import {
  parseJsonSafe,
  toGuildConfig,
  toGuildConfigCreateData,
  toGuildConfigUpdateData,
} from "./serializers/guildConfigSerializer";

const DB_ERROR = {
  UNKNOWN: "unknown error",
  GET_CONFIG_FAILED: "Failed to get guild config",
  SAVE_CONFIG_FAILED: "Failed to save guild config",
  UPDATE_CONFIG_FAILED: "Failed to update guild config",
  DELETE_CONFIG_FAILED: "Failed to delete guild config",
  CHECK_EXISTS_FAILED: "Failed to check guild config existence",
} as const;

/**
 * Prisma実装のRepository
 */
export class PrismaGuildConfigRepository implements IGuildConfigRepository {
  private prisma: PrismaClient;
  private readonly DEFAULT_LOCALE = "ja";
  private readonly afkConfigStore: GuildAfkConfigStore;
  private readonly bumpReminderStore: GuildBumpReminderConfigStore;
  private readonly vacConfigStore: GuildVacConfigStore;
  private readonly stickMessageStore: GuildStickMessageStore;
  private readonly memberLogConfigStore: GuildMemberLogConfigStore;

  constructor(prisma: PrismaClient) {
    // Prisma 参照を保持し、機能別ストアへ safeJsonParse を注入
    this.prisma = prisma;
    this.afkConfigStore = new GuildAfkConfigStore(
      prisma,
      this.DEFAULT_LOCALE,
      parseJsonSafe,
    );
    this.bumpReminderStore = new GuildBumpReminderConfigStore(
      prisma,
      this.DEFAULT_LOCALE,
      parseJsonSafe,
    );
    this.vacConfigStore = new GuildVacConfigStore(
      prisma,
      this.DEFAULT_LOCALE,
      parseJsonSafe,
    );
    this.stickMessageStore = new GuildStickMessageStore(
      prisma,
      parseJsonSafe,
      (guildId, updates) => this.updateConfig(guildId, updates),
    );
    this.memberLogConfigStore = new GuildMemberLogConfigStore(
      prisma,
      parseJsonSafe,
      (guildId, updates) => this.updateConfig(guildId, updates),
    );
  }

  private toDatabaseError(prefix: string, error: unknown): DatabaseError {
    return new DatabaseError(
      `${prefix}: ${error instanceof Error ? error.message : DB_ERROR.UNKNOWN}`,
    );
  }

  /**
   * Guild設定を取得
   */
  async getConfig(guildId: string): Promise<GuildConfig | null> {
    try {
      // 設定レコード全体を取得
      const record = await findGuildConfigRecord(this.prisma, guildId);

      if (!record) {
        return null;
      }

      // DB レコードをアプリ用 GuildConfig へ変換
      return toGuildConfig(record);
    } catch (error) {
      throw this.toDatabaseError(DB_ERROR.GET_CONFIG_FAILED, error);
    }
  }

  /**
   * Guild設定を保存（新規作成）
   */
  async saveConfig(config: GuildConfig): Promise<void> {
    try {
      // 新規作成時は JSON カラムを文字列化して保存
      await createGuildConfigRecord(
        this.prisma,
        toGuildConfigCreateData(config, this.DEFAULT_LOCALE),
      );
    } catch (error) {
      throw this.toDatabaseError(DB_ERROR.SAVE_CONFIG_FAILED, error);
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
      const data = toGuildConfigUpdateData(updates);

      // exists → update/insert の 2 クエリを回避、upsert 1 回に統一
      await upsertGuildConfigRecord(this.prisma, guildId, data, {
        guildId,
        locale: (updates.locale as string | undefined) ?? this.DEFAULT_LOCALE,
        ...data,
      });
    } catch (error) {
      throw this.toDatabaseError(DB_ERROR.UPDATE_CONFIG_FAILED, error);
    }
  }

  /**
   * Guild設定を削除
   */
  async deleteConfig(guildId: string): Promise<void> {
    try {
      await deleteGuildConfigRecord(this.prisma, guildId);
    } catch (error) {
      throw this.toDatabaseError(DB_ERROR.DELETE_CONFIG_FAILED, error);
    }
  }

  /**
   * Guild設定の存在確認
   */
  async exists(guildId: string): Promise<boolean> {
    try {
      return await existsGuildConfigRecord(this.prisma, guildId);
    } catch (error) {
      throw this.toDatabaseError(DB_ERROR.CHECK_EXISTS_FAILED, error);
    }
  }

  /**
   * Guild別言語取得
   * localeフィールドのみを取得する専用クエリ（全体取得より効率的）
   */
  async getLocale(guildId: string): Promise<string> {
    try {
      const locale = await findGuildLocale(this.prisma, guildId);
      // 未設定時は既定ロケールへフォールバック
      return locale || this.DEFAULT_LOCALE;
    } catch (_error) {
      // 取得失敗時も呼び出し側を止めず既定ロケールを返す
      return this.DEFAULT_LOCALE;
    }
  }

  /**
   * Guild別言語更新
   */
  async updateLocale(guildId: string, locale: string): Promise<void> {
    // locale 更新は共通更新ルート（upsert含む）へ委譲
    await this.updateConfig(guildId, { locale });
  }

  /**
   * 機能別の便利メソッド
   * 各取得メソッドは必要なフィールドのみ select して全体取得を避ける
   */
  async getAfkConfig(guildId: string): Promise<AfkConfig | null> {
    // AFK 設定取得は専用ストアへ委譲
    return this.afkConfigStore.getAfkConfig(guildId);
  }

  /**
   * AFKチャンネルを設定し、AFK機能を有効化する
   */
  async setAfkChannel(guildId: string, channelId: string): Promise<void> {
    // チャンネル設定は専用ストアへ委譲
    await this.afkConfigStore.setAfkChannel(guildId, channelId);
  }

  /**
   * AFK設定を安全に更新する（競合時は再試行）
   */
  async updateAfkConfig(guildId: string, afkConfig: AfkConfig): Promise<void> {
    // AFK 設定更新は専用ストアへ委譲
    await this.afkConfigStore.updateAfkConfig(guildId, afkConfig);
  }

  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    // Bump 設定取得は専用ストアへ委譲
    return this.bumpReminderStore.getBumpReminderConfig(guildId);
  }

  async setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void> {
    // enabled/channel 更新は専用ストアへ委譲
    await this.bumpReminderStore.setBumpReminderEnabled(
      guildId,
      enabled,
      channelId,
    );
  }

  async updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void> {
    // Bump 設定全体更新は専用ストアへ委譲
    await this.bumpReminderStore.updateBumpReminderConfig(
      guildId,
      bumpReminderConfig,
    );
  }

  async setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult> {
    // ロール設定更新は専用ストアへ委譲
    return this.bumpReminderStore.setBumpReminderMentionRole(guildId, roleId);
  }

  async addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult> {
    // メンションユーザー追加は専用ストアへ委譲
    return this.bumpReminderStore.addBumpReminderMentionUser(guildId, userId);
  }

  async removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult> {
    // メンションユーザー削除は専用ストアへ委譲
    return this.bumpReminderStore.removeBumpReminderMentionUser(
      guildId,
      userId,
    );
  }

  async clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult> {
    // メンションユーザー一括クリアは専用ストアへ委譲
    return this.bumpReminderStore.clearBumpReminderMentionUsers(guildId);
  }

  async clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult> {
    // ロール + ユーザー一括クリアは専用ストアへ委譲
    return this.bumpReminderStore.clearBumpReminderMentions(guildId);
  }

  /**
   * VAC設定を取得する
   */
  async getVacConfig(guildId: string): Promise<VacConfig | null> {
    // VAC 設定取得は専用ストアへ委譲
    return this.vacConfigStore.getVacConfig(guildId);
  }

  /**
   * VAC設定を更新する
   */
  async updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void> {
    // VAC 設定更新は専用ストアへ委譲
    await this.vacConfigStore.updateVacConfig(guildId, vacConfig);
  }

  /**
   * 固定メッセージ設定一覧を取得する
   */
  async getStickMessages(guildId: string): Promise<StickMessage[]> {
    // 固定メッセージ設定取得は専用ストアへ委譲
    return this.stickMessageStore.getStickMessages(guildId);
  }

  async updateStickMessages(
    guildId: string,
    stickMessages: StickMessage[],
  ): Promise<void> {
    // 固定メッセージ設定更新は専用ストアへ委譲
    await this.stickMessageStore.updateStickMessages(guildId, stickMessages);
  }

  /**
   * メンバーログ設定を取得する
   */
  async getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null> {
    // メンバーログ設定取得は専用ストアへ委譲
    return this.memberLogConfigStore.getMemberLogConfig(guildId);
  }

  async updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void> {
    // メンバーログ設定更新は専用ストアへ委譲
    await this.memberLogConfigStore.updateMemberLogConfig(
      guildId,
      memberLogConfig,
    );
  }
}

/**
 * Repositoryインスタンス作成
 */
export const createGuildConfigRepository = (
  prisma: PrismaClient,
): IGuildConfigRepository => {
  // ファクトリ経由で実装差し替え余地を維持
  return new PrismaGuildConfigRepository(prisma);
};
