// src/shared/database/stores/helpers/afkConfigCas.ts
// afkConfig の CAS 更新ヘルパー

import type { PrismaClient } from "@prisma/client";

export const AFK_CONFIG_CAS_MAX_RETRIES = 3;

type AfkConfigSnapshot = {
  recordExists: boolean;
  rawConfig: string | null;
};

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
