// src/shared/database/repositories/persistence/guildConfigReadPersistence.ts
// guildConfig の read 系永続化ヘルパー

import type { PrismaClient } from "@prisma/client";

export async function findGuildConfigRecord(
  prisma: PrismaClient,
  guildId: string,
) {
  return prisma.guildConfig.findUnique({
    where: { guildId },
  });
}

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
