// src/bot/services/botStickyMessageDependencyResolver.ts
// Bot 層でスティッキーメッセージ依存を解決するリゾルバ

import type { StickyMessageConfigService } from "../../shared/features/sticky-message/stickyMessageConfigService";
import type { StickyMessageResendService } from "../features/sticky-message/services/stickyMessageResendService";

let cachedConfigService: StickyMessageConfigService | undefined;
let cachedResendService: StickyMessageResendService | undefined;

/**
 * Bot 層で利用するスティッキーメッセージ設定サービスを設定する
 */
export function setBotStickyMessageConfigService(
  service: StickyMessageConfigService,
): void {
  cachedConfigService = service;
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
 * Bot 層で利用するスティッキーメッセージ設定サービスを取得する
 */
export function getBotStickyMessageConfigService(): StickyMessageConfigService {
  if (!cachedConfigService) {
    throw new Error(
      "StickyMessageConfigService is not initialized. Initialize in composition root first.",
    );
  }
  return cachedConfigService;
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
