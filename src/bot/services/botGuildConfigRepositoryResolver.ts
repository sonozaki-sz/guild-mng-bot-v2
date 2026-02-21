// src/bot/services/botGuildConfigRepositoryResolver.ts
// Bot層で利用する GuildConfigRepository の解決

import {
  getGuildConfigRepository,
  type IGuildConfigRepository,
} from "../../shared/database";

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
  return cachedRepository ?? getGuildConfigRepository();
}
