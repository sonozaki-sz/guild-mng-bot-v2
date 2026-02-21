import type { PrismaClient } from "@prisma/client";
import { BUMP_REMINDER_STATUS } from "../../constants";
import type { BumpReminder } from "../types";

export async function createBumpReminderUseCase(
  prisma: PrismaClient,
  guildId: string,
  channelId: string,
  scheduledAt: Date,
  messageId?: string,
  panelMessageId?: string,
  serviceName?: string,
): Promise<BumpReminder> {
  const reminder = await prisma.$transaction(async (tx) => {
    await tx.bumpReminder.updateMany({
      where: { guildId, status: BUMP_REMINDER_STATUS.PENDING },
      data: { status: BUMP_REMINDER_STATUS.CANCELLED },
    });

    return tx.bumpReminder.create({
      data: {
        guildId,
        channelId,
        messageId,
        panelMessageId,
        serviceName,
        scheduledAt,
        status: BUMP_REMINDER_STATUS.PENDING,
      },
    });
  });

  return reminder as BumpReminder;
}
