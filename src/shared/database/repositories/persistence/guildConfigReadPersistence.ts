// src/shared/database/repositories/persistence/guildConfigReadPersistence.ts
// guildConfig の read 系永続化ヘルパー

import type { PrismaClient } from "@prisma/client";

/**
 * guildConfig レコードを1件取得する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @returns guildConfig レコード
 */
export async function findGuildConfigRecord(
  prisma: PrismaClient,
  guildId: string,
) {
  return prisma.guildConfig.findUnique({
    where: { guildId },
  });
}

/**
 * guildConfig レコードの存在有無を返す
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @returns 存在する場合 true
 */
export async function existsGuildConfigRecord(
  prisma: PrismaClient,
  guildId: string,
): Promise<boolean> {
  const record = await prisma.guildConfig.findUnique({
    where: { guildId },
    select: { id: true },
  });
  return record !== null;
}

/**
 * guild の locale を取得する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @returns locale（未設定時はnull）
 */
export async function findGuildLocale(
  prisma: PrismaClient,
  guildId: string,
): Promise<string | null> {
  const record = await prisma.guildConfig.findUnique({
    where: { guildId },
    select: { locale: true },
  });
  return record?.locale ?? null;
}

/**
 * afkConfig JSON文字列を取得する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @returns afkConfig JSON（未設定時はnull）
 */
export async function findAfkConfigJson(
  prisma: PrismaClient,
  guildId: string,
): Promise<string | null> {
  const record = await prisma.guildConfig.findUnique({
    where: { guildId },
    select: { afkConfig: true },
  });
  return record?.afkConfig ?? null;
}

/**
 * stickMessages JSON文字列を取得する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @returns stickMessages JSON（未設定時はnull）
 */
export async function findStickMessagesJson(
  prisma: PrismaClient,
  guildId: string,
): Promise<string | null> {
  const record = await prisma.guildConfig.findUnique({
    where: { guildId },
    select: { stickMessages: true },
  });
  return record?.stickMessages ?? null;
}

/**
 * memberLogConfig JSON文字列を取得する
 * @param prisma Prismaクライアント
 * @param guildId 対象ギルドID
 * @returns memberLogConfig JSON（未設定時はnull）
 */
export async function findMemberLogConfigJson(
  prisma: PrismaClient,
  guildId: string,
): Promise<string | null> {
  const record = await prisma.guildConfig.findUnique({
    where: { guildId },
    select: { memberLogConfig: true },
  });
  return record?.memberLogConfig ?? null;
}
