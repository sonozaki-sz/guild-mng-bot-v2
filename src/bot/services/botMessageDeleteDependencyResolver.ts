// src/bot/services/botMessageDeleteDependencyResolver.ts
// Bot 層でメッセージ削除依存を解決するリゾルバ

import type { MessageDeleteUserSettingService } from "../../shared/features/message-delete/messageDeleteUserSettingService";

let cachedUserSettingService: MessageDeleteUserSettingService | undefined;

/**
 * Bot 層で利用する MessageDeleteUserSettingService を設定する
 */
export function setBotMessageDeleteUserSettingService(
  service: MessageDeleteUserSettingService,
): void {
  cachedUserSettingService = service;
}

/**
 * Bot 層で利用する MessageDeleteUserSettingService を取得する
 */
export function getBotMessageDeleteUserSettingService(): MessageDeleteUserSettingService {
  if (!cachedUserSettingService) {
    throw new Error(
      "MessageDeleteUserSettingService is not initialized. Initialize in composition root first.",
    );
  }
  return cachedUserSettingService;
}
