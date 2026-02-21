import type { BumpReminderConfig } from "../../types";
import type { BumpReminderStoreContext } from "./bumpReminderStoreContext";

export async function getBumpReminderConfigUseCase(
  context: BumpReminderStoreContext,
  guildId: string,
): Promise<BumpReminderConfig | null> {
  const record = await context.prisma.guildConfig.findUnique({
    where: { guildId },
    select: { bumpReminderConfig: true },
  });

  const parsed = context.safeJsonParse<BumpReminderConfig>(
    record?.bumpReminderConfig ?? null,
  );

  if (parsed) {
    return {
      ...parsed,
      mentionUserIds: Array.isArray(parsed.mentionUserIds)
        ? parsed.mentionUserIds
        : [],
    };
  }

  if (record?.bumpReminderConfig) {
    return null;
  }

  return {
    enabled: true,
    mentionRoleId: undefined,
    mentionUserIds: [],
  };
}
