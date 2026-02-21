// src/bot/services/botGuildConfigRepositoryResolver.ts
// Bot層で利用する GuildConfigRepository の解決

import { type IGuildConfigRepository } from "../../shared/database/types";

let cachedRepository: IGuildConfigRepository | undefined;

/**
 * Bot層で参照する GuildConfigRepository を注入する
 */
export function setBotGuildConfigRepository(
  repository: IGuildConfigRepository,
): void {
  cachedRepository = repository;
}

/**
 * Bot層で利用する GuildConfigRepository を取得する
 */
export function getBotGuildConfigRepository(): IGuildConfigRepository {
  if (!cachedRepository) {
    throw new Error(
      "GuildConfigRepository is not initialized. Initialize in composition root first.",
    );
  }

  return cachedRepository;
}
