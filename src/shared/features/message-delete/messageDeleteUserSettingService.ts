// src/shared/features/message-delete/messageDeleteUserSettingService.ts
// message-delete ユーザー設定サービス（Bot/Web 共有可能）

import type {
  IMessageDeleteUserSettingRepository,
  MessageDeleteUserSetting,
} from "../../database/types";

/**
 * message-delete ユーザー設定サービス
 * ユーザーごとの確認ダイアログ設定（skipConfirm）を管理する
 */
export class MessageDeleteUserSettingService {
  constructor(
    private readonly repository: IMessageDeleteUserSettingRepository,
  ) {}

  /**
   * ユーザーの設定を取得する
   * DB 未登録の場合はデフォルト値（skipConfirm: false）を返す
   */
  async getUserSetting(
    userId: string,
    guildId: string,
  ): Promise<{ skipConfirm: boolean }> {
    const setting = await this.repository.findByUserAndGuild(userId, guildId);
    return { skipConfirm: setting?.skipConfirm ?? false };
  }

  /**
   * ユーザーの設定を更新する（upsert）
   */
  async updateUserSetting(
    userId: string,
    guildId: string,
    patch: { skipConfirm: boolean },
  ): Promise<MessageDeleteUserSetting> {
    return this.repository.upsert(userId, guildId, patch);
  }
}

// ============================================================
// シングルトン管理
// ============================================================

let cachedService: MessageDeleteUserSettingService | undefined;

/**
 * MessageDeleteUserSettingService を生成して返す
 */
export function createMessageDeleteUserSettingService(
  repository: IMessageDeleteUserSettingRepository,
): MessageDeleteUserSettingService {
  const service = new MessageDeleteUserSettingService(repository);
  cachedService = service;
  return service;
}

/**
 * 登録済みの MessageDeleteUserSettingService を設定する
 */
export function setMessageDeleteUserSettingService(
  service: MessageDeleteUserSettingService,
): void {
  cachedService = service;
}

/**
 * 登録済みの MessageDeleteUserSettingService を取得する
 * 未初期化の場合は null を返す
 */
export function getMessageDeleteUserSettingService():
  | MessageDeleteUserSettingService
  | undefined {
  return cachedService;
}
