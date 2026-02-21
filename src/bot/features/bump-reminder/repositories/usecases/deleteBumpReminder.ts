import type { PrismaClient } from "@prisma/client";

export async function deleteBumpReminderUseCase(
  prisma: PrismaClient,
  id: string,
): Promise<void> {
  await prisma.bumpReminder.delete({
    where: { id },
  });
}
