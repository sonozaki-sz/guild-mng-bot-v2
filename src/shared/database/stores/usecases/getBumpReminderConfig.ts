// src/shared/database/stores/usecases/getBumpReminderConfig.ts
// BumpReminder設定取得ユースケース

import type { BumpReminderConfig } from "../../types";
import type { BumpReminderStoreContext } from "./bumpReminderStoreContext";

/**
 * ギルドのBumpReminder設定を取得し、欠損フィールドを補完して返す
 * @param context ストア実行コンテキスト
 * @param guildId 対象ギルドID
 * @returns BumpReminder設定（破損時はnull）
 */
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
