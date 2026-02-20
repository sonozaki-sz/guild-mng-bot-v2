// src/shared/database/stores/helpers/bumpReminderConfigCas.ts
// bumpReminderConfig の CAS 更新ヘルパー

import type { PrismaClient } from "@prisma/client";
import type { BumpReminderConfig } from "../../types";

export const BUMP_REMINDER_CAS_MAX_RETRIES = 3;

type BumpReminderConfigSnapshot = {
  recordExists: boolean;
  rawConfig: string | null;
};

export async function fetchBumpReminderConfigSnapshot(
  prisma: PrismaClient,
  guildId: string,
): Promise<BumpReminderConfigSnapshot> {
  const record = await prisma.guildConfig.findUnique({
    where: { guildId },
    select: { bumpReminderConfig: true },
  });

  return {
    recordExists: Boolean(record),
    rawConfig: record?.bumpReminderConfig ?? null,
  };
}

export function createInitialBumpReminderConfig(
  enabled = true,
  channelId?: string,
): BumpReminderConfig {
  return {
    enabled,
    channelId,
    mentionRoleId: undefined,
    mentionUserIds: [],
  };
}

export async function initializeBumpReminderConfigIfMissing(
  prisma: PrismaClient,
  guildId: string,
  defaultLocale: string,
  initialConfig: BumpReminderConfig,
  recordExists: boolean,
): Promise<boolean> {
  const initialJson = JSON.stringify(initialConfig);

  if (recordExists) {
    const initResult = await prisma.guildConfig.updateMany({
      where: {
        guildId,
        bumpReminderConfig: null,
      },
      data: {
        bumpReminderConfig: initialJson,
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
      bumpReminderConfig: initialJson,
    },
  });
  return true;
}

export async function casUpdateBumpReminderConfig(
  prisma: PrismaClient,
  guildId: string,
  expectedRawConfig: string | null,
  nextConfig: BumpReminderConfig | string,
): Promise<boolean> {
  const nextJson =
    typeof nextConfig === "string" ? nextConfig : JSON.stringify(nextConfig);

  const result = await prisma.guildConfig.updateMany({
    where: {
      guildId,
      bumpReminderConfig: expectedRawConfig,
    },
    data: {
      bumpReminderConfig: nextJson,
    },
  });

  return result.count > 0;
}
