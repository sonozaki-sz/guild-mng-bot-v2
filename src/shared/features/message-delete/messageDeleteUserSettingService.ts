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
   * @param userId 取得対象のユーザーID
   * @param guildId 取得対象のギルドID
   * @returns skipConfirm フラグを含む設定オブジェクトを示す Promise
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
   * @param userId 更新対象のユーザーID
   * @param guildId 更新対象のギルドID
   * @param patch 更新するフィールド（skipConfirm）
   * @returns 更新後の設定レコードを示す Promise
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
 * @param repository 利用する IMessageDeleteUserSettingRepository の実装
 * @returns 新規作成した MessageDeleteUserSettingService（シングルトンキャッシュに登録済み）
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
 * @param service 登録する MessageDeleteUserSettingService インスタンス
 */
export function setMessageDeleteUserSettingService(
  service: MessageDeleteUserSettingService,
): void {
  cachedService = service;
}

/**
 * 登録済みの MessageDeleteUserSettingService を取得する
 * 未初期化の場合は undefined を返す
 * @returns 登録済みの MessageDeleteUserSettingService、未登録の場合は undefined
 */
export function getMessageDeleteUserSettingService():
  | MessageDeleteUserSettingService
  | undefined {
  return cachedService;
}
