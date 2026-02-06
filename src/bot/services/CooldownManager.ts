// src/bot/services/CooldownManager.ts
// コマンドクールダウン管理

import { logger } from "../../shared/utils/logger";

/**
 * コマンドのクールダウンを管理するクラス
 * メモリリークを防ぎ、自動クリーンアップを行う
 */
export class CooldownManager {
  private cooldowns: Map<string, Map<string, number>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 5分ごとに期限切れクールダウンをクリーンアップ
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * クールダウンをチェックして設定
   * @param commandName コマンド名
   * @param userId ユーザーID
   * @param cooldownSeconds クールダウン時間（秒）
   * @returns 残り時間（秒）、クールダウン中でなければ0
   */
  check(commandName: string, userId: string, cooldownSeconds: number): number {
    const now = Date.now();

    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    const timestamps = this.cooldowns.get(commandName)!;
    const expirationTime = timestamps.get(userId);

    if (expirationTime && now < expirationTime) {
      return Math.ceil((expirationTime - now) / 1000);
    }

    // クールダウン設定
    timestamps.set(userId, now + cooldownSeconds * 1000);

    // 自動削除タイマー（メモリリーク防止）
    setTimeout(() => {
      timestamps.delete(userId);
      if (timestamps.size === 0) {
        this.cooldowns.delete(commandName);
      }
    }, cooldownSeconds * 1000);

    return 0;
  }

  /**
   * 特定ユーザーのクールダウンをリセット
   */
  reset(commandName: string, userId: string): void {
    this.cooldowns.get(commandName)?.delete(userId);
    logger.debug(`Cooldown reset: ${commandName} for user ${userId}`);
  }

  /**
   * 特定コマンドのすべてのクールダウンをクリア
   */
  clearCommand(commandName: string): void {
    this.cooldowns.delete(commandName);
    logger.debug(`All cooldowns cleared for command: ${commandName}`);
  }

  /**
   * すべてのクールダウンをクリア
   */
  clearAll(): void {
    this.cooldowns.clear();
    logger.debug("All cooldowns cleared");
  }

  /**
   * 期限切れクールダウンを一括削除
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [cmdName, timestamps] of this.cooldowns.entries()) {
      for (const [userId, expTime] of timestamps.entries()) {
        if (now >= expTime) {
          timestamps.delete(userId);
          removedCount++;
        }
      }
      if (timestamps.size === 0) {
        this.cooldowns.delete(cmdName);
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cleanup: removed ${removedCount} expired cooldowns`);
    }
  }

  /**
   * 現在のクールダウン状況を取得（デバッグ用）
   */
  getStats(): { totalCommands: number; totalUsers: number } {
    let totalUsers = 0;
    for (const timestamps of this.cooldowns.values()) {
      totalUsers += timestamps.size;
    }
    return {
      totalCommands: this.cooldowns.size,
      totalUsers,
    };
  }

  /**
   * クリーンアップを停止
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cooldowns.clear();
    logger.info("CooldownManager destroyed");
  }
}
