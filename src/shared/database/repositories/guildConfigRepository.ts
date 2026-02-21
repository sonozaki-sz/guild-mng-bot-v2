// src/shared/database/repositories/guildConfigRepository.ts
// Repositoryパターン実装（Prisma版）

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../errors/customErrors";
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
import { parseJsonSafe } from "./serializers/guildConfigSerializer";
import {
  deleteGuildConfigUsecase,
  existsGuildConfigUsecase,
  getGuildConfigUsecase,
  getGuildLocaleUsecase,
  saveGuildConfigUsecase,
  updateGuildConfigUsecase,
  updateGuildLocaleUsecase,
} from "./usecases/guildConfigCoreUsecases";

const DB_ERROR = {
  UNKNOWN: "unknown error",
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
  private readonly toDatabaseError = (
    prefix: string,
    error: unknown,
  ): DatabaseError =>
    new DatabaseError(
      `${prefix}: ${error instanceof Error ? error.message : DB_ERROR.UNKNOWN}`,
    );

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
      this.updateConfig.bind(this),
    );
    this.memberLogConfigStore = new GuildMemberLogConfigStore(
      prisma,
      parseJsonSafe,
      this.updateConfig.bind(this),
    );
  }

  /**
   * Guild設定を取得
   */
  async getConfig(guildId: string): Promise<GuildConfig | null> {
    return getGuildConfigUsecase(this.getCoreDeps(), guildId);
  }

  /**
   * Guild設定を保存（新規作成）
   */
  async saveConfig(config: GuildConfig): Promise<void> {
    await saveGuildConfigUsecase(this.getCoreDeps(), config);
  }

  /**
   * Guild設定を更新
   */
  async updateConfig(
    guildId: string,
    updates: Partial<GuildConfig>,
  ): Promise<void> {
    await updateGuildConfigUsecase(this.getCoreDeps(), guildId, updates);
  }

  /**
   * Guild設定を削除
   */
  async deleteConfig(guildId: string): Promise<void> {
    await deleteGuildConfigUsecase(this.getCoreDeps(), guildId);
  }

  /**
   * Guild設定の存在確認
   */
  async exists(guildId: string): Promise<boolean> {
    return existsGuildConfigUsecase(this.getCoreDeps(), guildId);
  }

  /**
   * Guild別言語取得
   * localeフィールドのみを取得する専用クエリ（全体取得より効率的）
   */
  async getLocale(guildId: string): Promise<string> {
    return getGuildLocaleUsecase(this.getCoreDeps(), guildId);
  }

  /**
   * Guild別言語更新
   */
  async updateLocale(guildId: string, locale: string): Promise<void> {
    await updateGuildLocaleUsecase(this.getCoreDeps(), guildId, locale);
  }

  private getCoreDeps() {
    return {
      prisma: this.prisma,
      defaultLocale: this.DEFAULT_LOCALE,
      toDatabaseError: (prefix: string, error: unknown) =>
        this.toDatabaseError(prefix, error),
    };
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
