// src/bot/services/botBumpReminderDependencyResolver.ts
// Bot層でbump-reminder依存を解決するリゾルバ

import type { BumpReminderConfigService } from "../../shared/features/bump-reminder/bumpReminderConfigService";
import type { IBumpReminderRepository as BumpReminderRepositoryType } from "../features/bump-reminder/repositories/types";
import { type BumpReminderManager } from "../features/bump-reminder/services/bumpReminderService";

let cachedConfigService: BumpReminderConfigService | undefined;
let cachedRepository: BumpReminderRepositoryType | undefined;
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
  repository: BumpReminderRepositoryType,
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
  if (!cachedConfigService) {
    throw new Error(
      "BumpReminderConfigService is not initialized. Initialize in composition root first.",
    );
  }

  return cachedConfigService;
}

/**
 * Bot層で利用するbump-reminderリポジトリを取得する
 */
export function getBotBumpReminderRepository(): BumpReminderRepositoryType {
  if (!cachedRepository) {
    throw new Error(
      "BumpReminderRepository is not initialized. Initialize in composition root first.",
    );
  }

  return cachedRepository;
}

/**
 * Bot層で利用するbump-reminderマネージャーを取得する
 */
export function getBotBumpReminderManager(): BumpReminderManager {
  if (!cachedManager) {
    throw new Error(
      "BumpReminderManager is not initialized. Initialize in composition root first.",
    );
  }

  return cachedManager;
}
