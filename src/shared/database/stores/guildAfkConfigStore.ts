// src/shared/database/stores/guildAfkConfigStore.ts
// AFK設定の永続化ストア

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../errors";
import type { AfkConfig } from "../types";
import {
  AFK_CONFIG_CAS_MAX_RETRIES,
  casUpdateAfkConfig,
  fetchAfkConfigSnapshot,
  initializeAfkConfigIfMissing,
} from "./helpers/afkConfigCas";

/**
 * Guild単位のAFK設定を永続化するストア
 */
export class GuildAfkConfigStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly defaultLocale: string,
    private readonly safeJsonParse: <T>(json: string | null) => T | undefined,
  ) {}

  /**
   * AFK設定を取得する
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
    const nextJson = JSON.stringify(afkConfig);

    for (let attempt = 0; attempt < AFK_CONFIG_CAS_MAX_RETRIES; attempt++) {
      const snapshot = await fetchAfkConfigSnapshot(this.prisma, guildId);
      const rawConfig = snapshot.rawConfig;
      const existingConfig = this.safeJsonParse<AfkConfig>(rawConfig);

      // 未初期化なら null 条件付き更新 or upsert で初期化
      if (!existingConfig) {
        const initialized = await initializeAfkConfigIfMissing(
          this.prisma,
          guildId,
          this.defaultLocale,
          nextJson,
          snapshot.recordExists,
        );
        if (initialized) {
          // null 状態からの初期投入が成功
          return;
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
      const updated = await casUpdateAfkConfig(
        this.prisma,
        guildId,
        rawConfig,
        updatedJson,
      );

      if (updated) {
        return;
      }

      // CAS 不一致時は他更新先行とみなし再試行
    }

    // 最大リトライ超過時のみ競合エラーとして失敗
    throw new DatabaseError(
      `Failed to update guild config: afk config update conflict (${guildId})`,
    );
  }
}
