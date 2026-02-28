// src/bot/services/botMessageDeleteDependencyResolver.ts
// Bot 層でメッセージ削除依存を解決するリゾルバ

import type { MessageDeleteUserSettingService } from "../../shared/features/message-delete/messageDeleteUserSettingService";

let cachedUserSettingService: MessageDeleteUserSettingService | undefined;

/**
 * Bot 層で利用する MessageDeleteUserSettingService を設定する
 * @param service 登録する MessageDeleteUserSettingService インスタンス
 */
export function setBotMessageDeleteUserSettingService(
  service: MessageDeleteUserSettingService,
): void {
  cachedUserSettingService = service;
}

/**
 * Bot 層で利用する MessageDeleteUserSettingService を取得する
 * @returns 登録済みの MessageDeleteUserSettingService
 * @throws 未初期化の場合は Error をスロー
 */
export function getBotMessageDeleteUserSettingService(): MessageDeleteUserSettingService {
  if (!cachedUserSettingService) {
    throw new Error(
      "MessageDeleteUserSettingService is not initialized. Initialize in composition root first.",
    );
  }
  return cachedUserSettingService;
}
