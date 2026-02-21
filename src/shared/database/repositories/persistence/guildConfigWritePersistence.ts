// src/shared/database/repositories/persistence/guildConfigWritePersistence.ts
// guildConfig の write 系永続化ヘルパー

import type { PrismaClient } from "@prisma/client";

export async function createGuildConfigRecord(
  prisma: PrismaClient,
  data: {
    guildId: string;
    locale: string;
    afkConfig: string | null;
    vacConfig: string | null;
    bumpReminderConfig: string | null;
    stickMessages: string | null;
    memberLogConfig: string | null;
  },
): Promise<void> {
  await prisma.guildConfig.create({ data });
}

export async function upsertGuildConfigRecord(
  prisma: PrismaClient,
  guildId: string,
  updateData: Record<string, unknown>,
  createData: {
    guildId: string;
    locale: string;
  } & Record<string, unknown>,
): Promise<void> {
  await prisma.guildConfig.upsert({
    where: { guildId },
    update: updateData,
    create: createData,
  });
}

export async function deleteGuildConfigRecord(
  prisma: PrismaClient,
  guildId: string,
): Promise<void> {
  await prisma.guildConfig.delete({
    where: { guildId },
  });
}
