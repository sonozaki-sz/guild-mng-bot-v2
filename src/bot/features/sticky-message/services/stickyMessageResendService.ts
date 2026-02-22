// src/bot/features/sticky-message/services/stickyMessageResendService.ts
// スティッキーメッセージ再送信サービス（レート制限付き）

import type { TextChannel } from "discord.js";
import type { IStickyMessageRepository } from "../../../../shared/database/types";
import { logger } from "../../../../shared/utils/logger";
import { buildStickyMessagePayload } from "./stickyMessagePayloadBuilder";

/** チャンネルごとの再送信タイマー管理 */
const resendTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** 最後に再送信した時刻（チャンネルID → epoch ms）*/
const lastResendAt = new Map<string, number>();

/** レート制限: 5秒 */
const RESEND_DELAY_MS = 5_000;

/**
 * スティッキーメッセージ再送信サービス
 */
export class StickyMessageResendService {
  constructor(private readonly repository: IStickyMessageRepository) {}

  /**
   * メッセージ作成イベントでスティッキーメッセージを処理する
   * 連続投稿時はデバウンスして最後のメッセージから5秒後に再送信する
   * @param channel 再送信対象のテキストチャンネル
   * @param guildId 対象ギルドID
   * @returns 実行完了を示す Promise
   */
  async handleMessageCreate(
    channel: TextChannel,
    guildId: string,
  ): Promise<void> {
    const channelId = channel.id;

    // 既存のタイマーをキャンセルしてデバウンス
    const existing = resendTimers.get(channelId);
    if (existing) {
      clearTimeout(existing);
    }

    // 5秒後に再送信をスケジュール
    const timer = setTimeout(() => {
      resendTimers.delete(channelId);
      void this.resend(channel, guildId).catch((err) => {
        logger.error("StickyMessage resend scheduled error", err);
      });
    }, RESEND_DELAY_MS);

    resendTimers.set(channelId, timer);
  }

  /**
   * スティッキーメッセージを実際に再送信する
   * @param channel 再送信対象のテキストチャンネル
   * @param guildId 対象ギルドID
   * @returns 実行完了を示す Promise
   */
  private async resend(channel: TextChannel, guildId: string): Promise<void> {
    const sticky = await this.repository.findByChannel(channel.id);
    if (!sticky) return;

    // 前のスティッキーメッセージを削除
    if (sticky.lastMessageId) {
      await this.deletePreviousMessage(channel, sticky.lastMessageId);
    }

    // 新しいスティッキーメッセージを送信
    const payload = buildStickyMessagePayload(sticky);
    try {
      const sent = await channel.send(payload);
      await this.repository.updateLastMessageId(sticky.id, sent.id);
      lastResendAt.set(channel.id, Date.now());
    } catch (err) {
      logger.error("Failed to send sticky message", {
        channelId: channel.id,
        guildId,
        err,
      });
    }
  }

  /**
   * 前のスティッキーメッセージを削除する（失敗しても続行）
   * @param channel チャンネル
   * @param messageId 削除対象メッセージID
   * @returns 実行完了を示す Promise
   */
  private async deletePreviousMessage(
    channel: TextChannel,
    messageId: string,
  ): Promise<void> {
    try {
      const msg = await channel.messages.fetch(messageId);
      await msg.delete();
    } catch {
      // 既に削除済みの場合は無視
      logger.debug("Previous sticky message already deleted or not found", {
        channelId: channel.id,
        messageId,
      });
    }
  }

  /**
   * チャンネルのタイマーをキャンセルする（チャンネル削除時など）
   * @param channelId タイマーを解除するチャンネルID
   */
  cancelTimer(channelId: string): void {
    const timer = resendTimers.get(channelId);
    if (timer) {
      clearTimeout(timer);
      resendTimers.delete(channelId);
    }
    lastResendAt.delete(channelId);
  }
}

let service: StickyMessageResendService | undefined;

/**
 * スティッキーメッセージ再送信サービスを取得する
 * @param repository 初回呼び出し時に必要な IStickyMessageRepository
 * @returns StickyMessageResendService インスタンス
 */
export function getStickyMessageResendService(
  repository?: IStickyMessageRepository,
): StickyMessageResendService {
  if (!service) {
    if (!repository) {
      throw new Error(
        "StickyMessageResendService is not initialized. Provide repository on first call.",
      );
    }
    service = new StickyMessageResendService(repository);
  }
  return service;
}
