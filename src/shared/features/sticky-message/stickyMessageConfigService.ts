// src/shared/features/sticky-message/stickyMessageConfigService.ts
// スティッキーメッセージ設定サービス（Repositoryパターン準拠）

import type {
  IStickyMessageRepository,
  StickyMessage,
} from "../../database/types";

export type { StickyMessage };

let cachedService: StickyMessageConfigService | undefined;

/**
 * スティッキーメッセージの永続化アクセスを担当するサービス
 */
export class StickyMessageConfigService {
  constructor(private readonly repository: IStickyMessageRepository) {}

  /**
   * チャンネル ID でスティッキーメッセージ設定を取得する
   */
  async findByChannel(channelId: string): Promise<StickyMessage | null> {
    return this.repository.findByChannel(channelId);
  }

  /**
   * ギルド内の全スティッキーメッセージ設定を取得する
   */
  async findAllByGuild(guildId: string): Promise<StickyMessage[]> {
    return this.repository.findAllByGuild(guildId);
  }

  /**
   * スティッキーメッセージ設定を新規作成する
   */
  async create(
    guildId: string,
    channelId: string,
    content: string,
    embedData?: string,
    updatedBy?: string,
  ): Promise<StickyMessage> {
    return this.repository.create(
      guildId,
      channelId,
      content,
      embedData,
      updatedBy,
    );
  }

  /**
   * 最後に送信したメッセージ ID を更新する
   */
  async updateLastMessageId(id: string, lastMessageId: string): Promise<void> {
    return this.repository.updateLastMessageId(id, lastMessageId);
  }

  /**
   * スティッキーメッセージの内容を更新する
   */
  async updateContent(
    id: string,
    content: string,
    embedData: string | null,
    updatedBy?: string,
  ): Promise<StickyMessage> {
    return this.repository.updateContent(id, content, embedData, updatedBy);
  }

  /**
   * スティッキーメッセージ設定を削除する
   */
  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  /**
   * チャンネルに紐づくスティッキーメッセージ設定を削除する
   */
  async deleteByChannel(channelId: string): Promise<void> {
    return this.repository.deleteByChannel(channelId);
  }
}

/**
 * IStickyMessageRepository からサービスを生成する
 */
export function createStickyMessageConfigService(
  repository: IStickyMessageRepository,
): StickyMessageConfigService {
  return new StickyMessageConfigService(repository);
}

/**
 * キャッシュ済みのサービスを登録する（composition root から呼び出す）
 */
export function setStickyMessageConfigService(
  service: StickyMessageConfigService,
): void {
  cachedService = service;
}

/**
 * キャッシュ済みのサービスを取得する
 */
export function getStickyMessageConfigService(): StickyMessageConfigService {
  if (!cachedService) {
    throw new Error(
      "StickyMessageConfigService is not initialized. Call setStickyMessageConfigService in composition root first.",
    );
  }
  return cachedService;
}
