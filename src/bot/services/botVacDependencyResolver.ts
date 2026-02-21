// src/bot/services/botVacDependencyResolver.ts
// Bot層でVAC依存を解決するリゾルバ

import type { IVacRepository } from "../features/vac";
import type { VacService } from "../features/vac/services";

let cachedVacRepository: IVacRepository | undefined;
let cachedVacService: VacService | undefined;

/**
 * Bot層で利用するVACリポジトリを明示設定する
 */
export function setBotVacRepository(repository: IVacRepository): void {
  cachedVacRepository = repository;
}

/**
 * Bot層で利用するVACサービスを明示設定する
 */
export function setBotVacService(service: VacService): void {
  cachedVacService = service;
}

/**
 * Bot層で利用するVACリポジトリを取得する
 */
export function getBotVacRepository(): IVacRepository {
  if (!cachedVacRepository) {
    throw new Error(
      "VacRepository is not initialized. Initialize in composition root first.",
    );
  }

  return cachedVacRepository;
}

/**
 * Bot層で利用するVACサービスを取得する
 */
export function getBotVacService(): VacService {
  if (!cachedVacService) {
    throw new Error(
      "VacService is not initialized. Initialize in composition root first.",
    );
  }

  return cachedVacService;
}
