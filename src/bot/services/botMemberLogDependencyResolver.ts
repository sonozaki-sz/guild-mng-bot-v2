// src/bot/services/botMemberLogDependencyResolver.ts
// Bot層でmember-log依存を解決するリゾルバ

import type { MemberLogConfigService } from "../../shared/features/member-log/memberLogConfigService";

let cachedConfigService: MemberLogConfigService | undefined;

/**
 * Bot層で利用するmember-log設定サービスを明示設定する
 * @param service 設定するサービスインスタンス
 */
export function setBotMemberLogConfigService(
  service: MemberLogConfigService,
): void {
  cachedConfigService = service;
}

/**
 * Bot層で利用するmember-log設定サービスを取得する
 * @returns MemberLogConfigService シングルトン
 */
export function getBotMemberLogConfigService(): MemberLogConfigService {
  if (!cachedConfigService) {
    throw new Error(
      "MemberLogConfigService is not initialized. Initialize in composition root first.",
    );
  }

  return cachedConfigService;
}
