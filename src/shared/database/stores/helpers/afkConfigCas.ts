// src/shared/database/stores/helpers/afkConfigCas.ts
// afkConfig の CAS 更新ヘルパー

import type { PrismaClient } from "@prisma/client";

export const AFK_CONFIG_CAS_MAX_RETRIES = 3;

type AfkConfigSnapshot = {
  recordExists: boolean;
  rawConfig: string | null;
};

/**
 * afkConfig の現在スナップショットを取得する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @returns レコード存在有無と生JSON
 */
export async function fetchAfkConfigSnapshot(
  prisma: PrismaClient,
  guildId: string,
): Promise<AfkConfigSnapshot> {
  const record = await prisma.guildConfig.findUnique({
    where: { guildId },
    select: { afkConfig: true },
  });

  return {
    recordExists: Boolean(record),
    rawConfig: record?.afkConfig ?? null,
  };
}

/**
 * afkConfig が未設定のとき初期値を設定する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @param defaultLocale 既定ロケール
 * @param nextJson 初期JSON
 * @param recordExists レコード存在有無
 * @returns 初期化した場合 true
 */
export async function initializeAfkConfigIfMissing(
  prisma: PrismaClient,
  guildId: string,
  defaultLocale: string,
  nextJson: string,
  recordExists: boolean,
): Promise<boolean> {
  if (recordExists) {
    const initResult = await prisma.guildConfig.updateMany({
      where: {
        guildId,
        afkConfig: null,
      },
      data: {
        afkConfig: nextJson,
      },
    });
    return initResult.count > 0;
  }

  await prisma.guildConfig.upsert({
    where: { guildId },
    update: {},
    create: {
      guildId,
      locale: defaultLocale,
      afkConfig: nextJson,
    },
  });
  return true;
}

/**
 * 期待値一致時のみ afkConfig を更新する CAS 更新を行う
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @param expectedRawConfig 期待する現行JSON
 * @param nextJson 更新後JSON
 * @returns 更新成功時 true
 */
export async function casUpdateAfkConfig(
  prisma: PrismaClient,
  guildId: string,
  expectedRawConfig: string | null,
  nextJson: string,
): Promise<boolean> {
  const result = await prisma.guildConfig.updateMany({
    where: {
      guildId,
      afkConfig: expectedRawConfig,
    },
    data: {
      afkConfig: nextJson,
    },
  });

  return result.count > 0;
}
