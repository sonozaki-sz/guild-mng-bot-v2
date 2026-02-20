// src/shared/database/index.ts
// Database module exports

export {
  createGuildConfigRepository,
  PrismaGuildConfigRepository,
} from "./repositories/guildConfigRepository";
export {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
} from "./types";
export type {
  BumpReminderConfig,
  BumpReminderMentionClearResult,
  BumpReminderMentionRoleResult,
  BumpReminderMentionUserAddResult,
  BumpReminderMentionUserRemoveResult,
  BumpReminderMentionUsersClearResult,
  IAfkRepository,
  IBaseGuildRepository,
  IBumpReminderConfigRepository,
  IGuildConfigRepository,
  IVacRepository,
  VacChannelPair,
  VacConfig,
} from "./types";

import type { PrismaClient } from "@prisma/client";
import { requirePrismaClient } from "../utils";
import { createGuildConfigRepository } from "./repositories/guildConfigRepository";
import type { IGuildConfigRepository } from "./types";

// シングルトンキャッシュ
// Prismaクライアントが差し替えられた場合（テスト等）は自動的に再生成する
let _cachedRepository: IGuildConfigRepository | undefined;
let _cachedPrisma: PrismaClient | undefined;

/**
 * GuildConfigRepositoryのシングルトンを返す
 * Prismaクライアントが変わった場合（テスト時のモック差し替えなど）は自動的に再生成する
 */
export function getGuildConfigRepository(): IGuildConfigRepository {
  // 現在アクティブな Prisma インスタンスを取得
  const prisma = requirePrismaClient();
  // Prisma 差し替え時（主にテスト）や初回呼び出し時に repository を再生成
  if (!_cachedRepository || _cachedPrisma !== prisma) {
    // 依存 Prisma に紐づく新しい repository を生成
    _cachedRepository = createGuildConfigRepository(prisma);
    _cachedPrisma = prisma;
  }
  // 現在有効な repository シングルトンを返す
  return _cachedRepository;
}

/**
 * キャッシュをリセット（テスト用途）
 */
export function resetGuildConfigRepositoryCache(): void {
  // テストごとに repository / prisma の関連付けをクリア
  _cachedRepository = undefined;
  _cachedPrisma = undefined;
}
