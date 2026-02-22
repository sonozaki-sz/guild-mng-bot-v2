// src/bot/services/botStickyMessageDependencyResolver.ts
// Bot 層でスティッキーメッセージ依存を解決するリゾルバ

import type { IStickyMessageRepository } from "../features/sticky-message/repositories/types";
import type { StickyMessageResendService } from "../features/sticky-message/services/stickyMessageResendService";

let cachedRepository: IStickyMessageRepository | undefined;
let cachedResendService: StickyMessageResendService | undefined;

/**
 * Bot 層で利用するスティッキーメッセージリポジトリを設定する
 */
export function setBotStickyMessageRepository(
  repository: IStickyMessageRepository,
): void {
  cachedRepository = repository;
}

/**
 * Bot 層で利用するスティッキーメッセージ再送信サービスを設定する
 */
export function setBotStickyMessageResendService(
  service: StickyMessageResendService,
): void {
  cachedResendService = service;
}

/**
 * Bot 層で利用するスティッキーメッセージリポジトリを取得する
 */
export function getBotStickyMessageRepository(): IStickyMessageRepository {
  if (!cachedRepository) {
    throw new Error(
      "StickyMessageRepository is not initialized. Initialize in composition root first.",
    );
  }
  return cachedRepository;
}

/**
 * Bot 層で利用するスティッキーメッセージ再送信サービスを取得する
 */
export function getBotStickyMessageResendService(): StickyMessageResendService {
  if (!cachedResendService) {
    throw new Error(
      "StickyMessageResendService is not initialized. Initialize in composition root first.",
    );
  }
  return cachedResendService;
}
