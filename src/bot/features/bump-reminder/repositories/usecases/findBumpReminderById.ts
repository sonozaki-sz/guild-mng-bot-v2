import type { PrismaClient } from "@prisma/client";
import type { BumpReminder } from "../types";

export async function findBumpReminderByIdUseCase(
  prisma: PrismaClient,
  id: string,
): Promise<BumpReminder | null> {
  const result = await prisma.bumpReminder.findUnique({
    where: { id },
  });

  return result as BumpReminder | null;
}
