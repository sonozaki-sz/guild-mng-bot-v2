// src/shared/database/stores/usecases/bumpReminderStoreContext.ts
// BumpReminderストア用コンテキスト型定義

import type { PrismaClient } from "@prisma/client";

export type BumpReminderStoreContext = {
  prisma: PrismaClient;
  defaultLocale: string;
  safeJsonParse: <T>(json: string | null) => T | undefined;
};
