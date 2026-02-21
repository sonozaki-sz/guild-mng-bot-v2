// src/shared/database/stores/guildVacConfigStore.ts
// VAC設定の永続化ストア

import type { PrismaClient } from "@prisma/client";
import type { VacConfig } from "../types";

/**
 * Guild単位のVAC設定を永続化するストア
 */
export class GuildVacConfigStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly defaultLocale: string,
    private readonly safeJsonParse: <T>(json: string | null) => T | undefined,
  ) {}

  /**
   * VAC設定を取得する
   */
  async getVacConfig(guildId: string): Promise<VacConfig | null> {
    // VAC 設定カラムのみを select して最小限のクエリにする
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { vacConfig: true },
    });
    // 未設定/不正JSON時は null として扱う
    return this.safeJsonParse<VacConfig>(record?.vacConfig ?? null) ?? null;
  }

  /**
   * VAC設定を保存する（未作成時はレコード作成）
   */
  async updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void> {
    // JSON カラムへ保存するため文字列化
    const vacConfigJson = JSON.stringify(vacConfig);

    // guild レコード未作成でも保存できるよう upsert で統一
    await this.prisma.guildConfig.upsert({
      where: { guildId },
      // 既存 guild は vacConfig のみ上書き
      update: {
        vacConfig: vacConfigJson,
      },
      // 未作成 guild は最小必須フィールドで新規作成
      create: {
        guildId,
        locale: this.defaultLocale,
        vacConfig: vacConfigJson,
      },
    });
  }
}
