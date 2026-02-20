// src/shared/database/repositories/guildConfigRepository.ts
// Repositoryパターン実装（Prisma版）

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../errors/customErrors";
import { GuildBumpReminderConfigStore } from "../stores/guildBumpReminderConfigStore";
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
  private readonly bumpReminderStore: GuildBumpReminderConfigStore;
  private readonly vacConfigStore: GuildVacConfigStore;

  constructor(prisma: PrismaClient) {
    // Prisma 参照を保持し、機能別ストアへ safeJsonParse を注入
    this.prisma = prisma;
    this.bumpReminderStore = new GuildBumpReminderConfigStore(
      prisma,
      this.DEFAULT_LOCALE,
      this.safeJsonParse.bind(this),
    );
    this.vacConfigStore = new GuildVacConfigStore(
      prisma,
      this.DEFAULT_LOCALE,
      this.safeJsonParse.bind(this),
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
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
      });

      if (!record) {
        return null;
      }

      // DB レコードをアプリ用 GuildConfig へ変換
      return this.recordToConfig(record);
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
      await this.prisma.guildConfig.create({
        data: {
          guildId: config.guildId,
          locale: config.locale || this.DEFAULT_LOCALE,
          afkConfig: config.afkConfig ? JSON.stringify(config.afkConfig) : null,
          vacConfig: config.vacConfig ? JSON.stringify(config.vacConfig) : null,
          bumpReminderConfig: config.bumpReminderConfig
            ? JSON.stringify(config.bumpReminderConfig)
            : null,
          stickMessages: config.stickMessages
            ? JSON.stringify(config.stickMessages)
            : null,
          memberLogConfig: config.memberLogConfig
            ? JSON.stringify(config.memberLogConfig)
            : null,
        },
      });
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
      // 更新データの準備
      const data: Record<string, unknown> = {};

      // 更新対象のみを詰めた data を upsert に渡す
      if (updates.locale !== undefined) data.locale = updates.locale;
      if (updates.afkConfig !== undefined)
        data.afkConfig = JSON.stringify(updates.afkConfig);
      if (updates.vacConfig !== undefined)
        data.vacConfig = JSON.stringify(updates.vacConfig);
      if (updates.bumpReminderConfig !== undefined)
        data.bumpReminderConfig = JSON.stringify(updates.bumpReminderConfig);
      if (updates.stickMessages !== undefined)
        data.stickMessages = JSON.stringify(updates.stickMessages);
      if (updates.memberLogConfig !== undefined)
        data.memberLogConfig = JSON.stringify(updates.memberLogConfig);

      // exists → update/insert の 2 クエリを回避、upsert 1 回に統一
      await this.prisma.guildConfig.upsert({
        where: { guildId },
        update: data,
        create: {
          guildId,
          locale: (updates.locale as string | undefined) ?? this.DEFAULT_LOCALE,
          ...data,
        },
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
      await this.prisma.guildConfig.delete({
        where: { guildId },
      });
    } catch (error) {
      throw this.toDatabaseError(DB_ERROR.DELETE_CONFIG_FAILED, error);
    }
  }

  /**
   * Guild設定の存在確認
   */
  async exists(guildId: string): Promise<boolean> {
    try {
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { id: true },
      });
      return record !== null;
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
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { locale: true },
      });
      // 未設定時は既定ロケールへフォールバック
      return record?.locale || this.DEFAULT_LOCALE;
    } catch (error) {
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
    // AFK 設定カラムのみ select
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { afkConfig: true },
    });
    return this.safeJsonParse<AfkConfig>(record?.afkConfig ?? null) ?? null;
  }

  /**
   * AFKチャンネルを設定し、AFK機能を有効化する
   */
  async setAfkChannel(guildId: string, channelId: string): Promise<void> {
    // チャンネル設定時は AFK を有効化して保存
    await this.updateAfkConfig(guildId, {
      enabled: true,
      channelId,
    });
  }

  /**
   * AFK設定を安全に更新する（競合時は再試行）
   */
  async updateAfkConfig(guildId: string, afkConfig: AfkConfig): Promise<void> {
    // AFK 設定は競合を想定した CAS 更新
    const maxRetries = 3;
    const nextJson = JSON.stringify(afkConfig);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // CAS 比較用の最新値を取得
      // 毎リトライで最新状態を読み直す
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { afkConfig: true },
      });

      const rawConfig = record?.afkConfig ?? null;
      const existingConfig = this.safeJsonParse<AfkConfig>(rawConfig);

      // 未初期化なら null 条件付き更新 or upsert で初期化
      if (!existingConfig) {
        if (record) {
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              afkConfig: null,
            },
            data: {
              afkConfig: nextJson,
            },
          });
          if (initResult.count > 0) {
            // null 状態からの初期投入が成功
            return;
          }
        } else {
          // レコード自体が無い場合は guild 行ごと作成
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.DEFAULT_LOCALE,
              afkConfig: nextJson,
            },
          });
        }
        continue;
      }

      // 既存値に部分更新をマージ
      const updatedConfig: AfkConfig = {
        ...existingConfig,
        ...afkConfig,
      };

      // 変更がない場合は更新不要
      const updatedJson = JSON.stringify(updatedConfig);
      if (updatedJson === rawConfig) {
        return;
      }

      // 旧値一致条件で CAS 更新
      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          afkConfig: rawConfig,
        },
        data: {
          afkConfig: updatedJson,
        },
      });

      if (result.count > 0) {
        return;
      }

      // CAS 不一致時は他更新先行とみなし再試行
    }

    // 最大リトライ超過時のみ競合エラーとして失敗
    throw new DatabaseError(
      `${DB_ERROR.UPDATE_CONFIG_FAILED}: afk config update conflict (${guildId})`,
    );
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
    // stickMessages カラムのみ select
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { stickMessages: true },
    });
    // 未設定/不正JSONは空配列へフォールバック
    return (
      this.safeJsonParse<StickMessage[]>(record?.stickMessages ?? null) ?? []
    );
  }

  async updateStickMessages(
    guildId: string,
    stickMessages: StickMessage[],
  ): Promise<void> {
    // 統一更新ルート（upsert含む）へ委譲
    await this.updateConfig(guildId, { stickMessages });
  }

  /**
   * メンバーログ設定を取得する
   */
  async getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null> {
    // memberLogConfig カラムのみ select
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { memberLogConfig: true },
    });
    return (
      this.safeJsonParse<MemberLogConfig>(record?.memberLogConfig ?? null) ??
      null
    );
  }

  async updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void> {
    // 統一更新ルート（upsert含む）へ委譲
    await this.updateConfig(guildId, { memberLogConfig });
  }

  /**
   * PrismaレコードをGuildConfigに変換
   */
  private recordToConfig(record: {
    id: string;
    guildId: string;
    locale: string;
    afkConfig: string | null;
    vacConfig: string | null;
    bumpReminderConfig: string | null;
    stickMessages: string | null;
    memberLogConfig: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): GuildConfig {
    // JSON カラムは必要な型へ安全に逆変換して詰め直す
    return {
      guildId: record.guildId,
      locale: record.locale,
      afkConfig: this.safeJsonParse<AfkConfig>(record.afkConfig),
      vacConfig: this.safeJsonParse<VacConfig>(record.vacConfig),
      bumpReminderConfig: this.safeJsonParse<BumpReminderConfig>(
        record.bumpReminderConfig,
      ),
      stickMessages: this.safeJsonParse<StickMessage[]>(record.stickMessages),
      memberLogConfig: this.safeJsonParse<MemberLogConfig>(
        record.memberLogConfig,
      ),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * 安全なJSON.parse（エラーハンドリング付き）
   */
  private safeJsonParse<T>(json: string | null): T | undefined {
    // null/空は未設定として扱う
    if (!json) return undefined;
    try {
      return JSON.parse(json) as T;
    } catch (error) {
      // 壊れた JSON はログ化して undefined を返す
      return undefined;
    }
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
