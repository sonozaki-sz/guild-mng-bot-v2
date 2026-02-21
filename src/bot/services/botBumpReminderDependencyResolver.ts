// src/bot/services/botBumpReminderDependencyResolver.ts
// Bot層でbump-reminder依存を解決するリゾルバ

import type { BumpReminderConfigService } from "../../shared/features/bump-reminder";
import {
  getBumpReminderFeatureConfigService,
  getBumpReminderManager,
  getBumpReminderRepository,
  type BumpReminderManager,
  type IBumpReminderRepository,
} from "../features/bump-reminder";

let cachedConfigService: BumpReminderConfigService | undefined;
let cachedRepository: IBumpReminderRepository | undefined;
let cachedManager: BumpReminderManager | undefined;

/**
 * Bot層で利用するbump-reminder設定サービスを明示設定する
 */
export function setBotBumpReminderConfigService(
  service: BumpReminderConfigService,
): void {
  cachedConfigService = service;
}

/**
 * Bot層で利用するbump-reminderリポジトリを明示設定する
 */
export function setBotBumpReminderRepository(
  repository: IBumpReminderRepository,
): void {
  cachedRepository = repository;
}

/**
 * Bot層で利用するbump-reminderマネージャーを明示設定する
 */
export function setBotBumpReminderManager(manager: BumpReminderManager): void {
  cachedManager = manager;
}

/**
 * Bot層で利用するbump-reminder設定サービスを取得する
 */
export function getBotBumpReminderConfigService(): BumpReminderConfigService {
  return cachedConfigService ?? getBumpReminderFeatureConfigService();
}

/**
 * Bot層で利用するbump-reminderリポジトリを取得する
 */
export function getBotBumpReminderRepository(
  prisma?: Parameters<typeof getBumpReminderRepository>[0],
): IBumpReminderRepository {
  if (cachedRepository) {
    return cachedRepository;
  }

  if (!prisma) {
    throw new Error(
      "BumpReminderRepository is not initialized. Initialize in composition root first.",
    );
  }

  return getBumpReminderRepository(prisma);
}

/**
 * Bot層で利用するbump-reminderマネージャーを取得する
 */
export function getBotBumpReminderManager(): BumpReminderManager {
  if (cachedManager) {
    return cachedManager;
  }

  if (cachedRepository) {
    const manager = getBumpReminderManager(cachedRepository);
    cachedManager = manager;
    return manager;
  }

  throw new Error(
    "BumpReminderManager is not initialized. Initialize in composition root first.",
  );
}
