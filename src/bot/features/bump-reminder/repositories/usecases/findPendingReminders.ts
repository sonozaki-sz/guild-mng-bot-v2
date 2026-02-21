import type { PrismaClient } from "@prisma/client";
import { BUMP_REMINDER_STATUS } from "../../constants";
import type { BumpReminder } from "../types";

export async function findPendingByGuildUseCase(
  prisma: PrismaClient,
  guildId: string,
): Promise<BumpReminder | null> {
  const result = await prisma.bumpReminder.findFirst({
    where: {
      guildId,
      status: BUMP_REMINDER_STATUS.PENDING,
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  return result as BumpReminder | null;
}

export async function findAllPendingUseCase(
  prisma: PrismaClient,
): Promise<BumpReminder[]> {
  const results = await prisma.bumpReminder.findMany({
    where: {
      status: BUMP_REMINDER_STATUS.PENDING,
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  return results as BumpReminder[];
}
