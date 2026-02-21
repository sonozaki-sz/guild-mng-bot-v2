// src/shared/database/stores/guildMemberLogConfigStore.ts
// メンバーログ設定の永続化ストア

import type { PrismaClient } from "@prisma/client";
import { findMemberLogConfigJson } from "../repositories/persistence/guildConfigReadPersistence";
import type { MemberLogConfig } from "../types";

type UpdateConfigFn = (
  guildId: string,
  updates: { memberLogConfig: MemberLogConfig },
) => Promise<void>;

/**
 * Guild単位のメンバーログ設定を永続化するストア
 */
export class GuildMemberLogConfigStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly safeJsonParse: <T>(json: string | null) => T | undefined,
    private readonly updateConfig: UpdateConfigFn,
  ) {}

  async getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null> {
    // memberLogConfig カラムのみ select
    const memberLogConfigJson = await findMemberLogConfigJson(
      this.prisma,
      guildId,
    );
    return this.safeJsonParse<MemberLogConfig>(memberLogConfigJson) ?? null;
  }

  async updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void> {
    // 統一更新ルート（upsert含む）へ委譲
    await this.updateConfig(guildId, { memberLogConfig });
  }
}
