// src/bot/features/bump-reminder/services/helpers/bumpReminderRestorePlanner.ts
// bump-reminder 復元時の pending 正規化ヘルパー

import type { BumpReminder } from "../../repositories/types";

export interface BumpReminderRestorePlan {
  latestByGuild: Map<string, BumpReminder>;
  staleReminders: BumpReminder[];
}

/**
 * 同一 guild の pending を最新1件へ正規化する計画を作成する
 */
export function createBumpReminderRestorePlan(
  pendingReminders: BumpReminder[],
): BumpReminderRestorePlan {
  const latestByGuild = new Map<string, BumpReminder>();
  const staleReminders: BumpReminder[] = [];

  for (const reminder of pendingReminders) {
    const existing = latestByGuild.get(reminder.guildId);
    if (!existing || reminder.scheduledAt > existing.scheduledAt) {
      if (existing) {
        staleReminders.push(existing);
      }
      latestByGuild.set(reminder.guildId, reminder);
    } else {
      staleReminders.push(reminder);
    }
  }

  return { latestByGuild, staleReminders };
}
