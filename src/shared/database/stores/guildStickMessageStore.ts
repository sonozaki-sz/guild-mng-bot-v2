// src/shared/database/stores/guildStickMessageStore.ts
// 固定メッセージ設定の永続化ストア

import type { PrismaClient } from "@prisma/client";
import { findStickMessagesJson } from "../repositories/persistence/guildConfigReadPersistence";
import type { StickMessage } from "../types";

type UpdateConfigFn = (
  guildId: string,
  updates: { stickMessages: StickMessage[] },
) => Promise<void>;

/**
 * Guild単位の固定メッセージ設定を永続化するストア
 */
export class GuildStickMessageStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly safeJsonParse: <T>(json: string | null) => T | undefined,
    private readonly updateConfig: UpdateConfigFn,
  ) {}

  async getStickMessages(guildId: string): Promise<StickMessage[]> {
    // stickMessages カラムのみ select
    const stickMessagesJson = await findStickMessagesJson(this.prisma, guildId);
    // 未設定/不正JSONは空配列へフォールバック
    return this.safeJsonParse<StickMessage[]>(stickMessagesJson) ?? [];
  }

  async updateStickMessages(
    guildId: string,
    stickMessages: StickMessage[],
  ): Promise<void> {
    // 統一更新ルート（upsert含む）へ委譲
    await this.updateConfig(guildId, { stickMessages });
  }
}
