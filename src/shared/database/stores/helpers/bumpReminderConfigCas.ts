// src/shared/database/stores/helpers/bumpReminderConfigCas.ts
// bumpReminderConfig の CAS 更新ヘルパー

import type { PrismaClient } from "@prisma/client";
import type { BumpReminderConfig } from "../../types";

export const BUMP_REMINDER_CAS_MAX_RETRIES = 3;

type BumpReminderConfigSnapshot = {
  recordExists: boolean;
  rawConfig: string | null;
};

/**
 * bumpReminderConfig の現在スナップショットを取得する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @returns レコード存在有無と生JSON
 */
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

/**
 * bumpReminderConfig の初期値を生成する
 * @param enabled 有効状態
 * @param channelId 対象チャンネルID
 * @returns 初期設定
 */
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

/**
 * bumpReminderConfig が未設定のとき初期値を設定する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @param defaultLocale 既定ロケール
 * @param initialConfig 初期設定
 * @param recordExists レコード存在有無
 * @returns 初期化した場合 true
 */
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

/**
 * 期待値一致時のみ bumpReminderConfig を更新する CAS 更新を行う
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @param expectedRawConfig 期待する現行JSON
 * @param nextConfig 更新後設定またはJSON
 * @returns 更新成功時 true
 */
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
