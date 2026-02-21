import type { PrismaClient } from "@prisma/client";

export type BumpReminderStoreContext = {
  prisma: PrismaClient;
  defaultLocale: string;
  safeJsonParse: <T>(json: string | null) => T | undefined;
};
