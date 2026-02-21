// src/bot/features/bump-reminder/services/bumpReminderConfigServiceResolver.ts
// bump-reminder 設定サービスの依存解決

import {
  getGuildConfigRepository,
  type IBumpReminderConfigRepository,
} from "../../../../shared/database";
import {
  BumpReminderConfigService,
  createBumpReminderConfigService,
} from "../../../../shared/features/bump-reminder";

let cachedService: BumpReminderConfigService | undefined;
let cachedRepository: IBumpReminderConfigRepository | undefined;

/**
 * 注入された repository から設定サービスを生成する
 */
export function createBumpReminderFeatureConfigService(
  repository: IBumpReminderConfigRepository,
): BumpReminderConfigService {
  return createBumpReminderConfigService(repository);
}

/**
 * Bot層で利用する bump-reminder 設定サービスを解決する
 */
export function getBumpReminderFeatureConfigService(
  repository?: IBumpReminderConfigRepository,
): BumpReminderConfigService {
  const resolvedRepository = repository ?? getGuildConfigRepository();

  if (!cachedService || cachedRepository !== resolvedRepository) {
    cachedService = createBumpReminderFeatureConfigService(resolvedRepository);
    cachedRepository = resolvedRepository;
  }

  return cachedService;
}
