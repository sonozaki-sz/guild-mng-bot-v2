// src/bot/features/message-delete/services/messageDeleteService.ts
// メッセージ削除コアロジック

import type { Collection, GuildTextBasedChannel, Message } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { logger } from "../../../../shared/utils/logger";
import {
  MSG_DEL_BULK_BATCH_SIZE,
  MSG_DEL_BULK_MAX_AGE_MS,
  MSG_DEL_BULK_WAIT_MS,
  MSG_DEL_CONTENT_MAX_LENGTH,
  MSG_DEL_FETCH_BATCH_SIZE,
  MSG_DEL_INDIVIDUAL_WAIT_MS,
  type DeletedMessageRecord,
} from "../constants/messageDeleteConstants";

/** メッセージ収集・削除オプション */
export interface MessageDeleteOptions {
  /** 削除するメッセージの上限件数（未指定で無限） */
  count: number;
  /** 対象ユーザーID（未指定で全ユーザー） */
  targetUserId?: string;
  /** true のときボット・webhookのメッセージのみ対象 */
  targetBot?: boolean;
  /** キーワード部分一致（case-insensitive、未指定でフィルタなし） */
  keyword?: string;
  /** afterTs の Unix ミリ秒（0 = 制限なし） */
  afterTs: number;
  /** beforeTs の Unix ミリ秒（Infinity = 制限なし） */
  beforeTs: number;
  /** 進捗コールバック */
  onProgress?: (message: string) => Promise<void>;
}

/** 削除結果 */
export interface MessageDeleteResult {
  /** 合計削除件数 */
  totalDeleted: number;
  /** チャンネル別削除件数 */
  channelBreakdown: Record<string, number>;
  /** 削除済みメッセージの記録 */
  deletedRecords: DeletedMessageRecord[];
}

/**
 * 指定チャンネルリストから条件に一致するメッセージを削除する
 */
export async function deleteMessages(
  channels: GuildTextBasedChannel[],
  options: MessageDeleteOptions,
): Promise<MessageDeleteResult> {
  const {
    count,
    targetUserId,
    targetBot,
    keyword,
    afterTs,
    beforeTs,
    onProgress,
  } = options;

  const twoWeeksAgo = Date.now() - MSG_DEL_BULK_MAX_AGE_MS;
  const deletedRecords: DeletedMessageRecord[] = [];
  const channelBreakdown: Record<string, number> = {};
  let totalDeleted = 0;

  // 進捗表示ヘルパー（スキャン中・削除中共通、最大3秒に1回 + force=trueで即時）
  let lastProgressTs = 0;
  const report = async (msg: string, force = false) => {
    if (!onProgress) return;
    const now = Date.now();
    if (force || now - lastProgressTs >= 3000) {
      lastProgressTs = now;
      await onProgress(msg);
    }
  };

  logger.debug(
    `[MsgDel][SVC] channels=${channels.length}, count=${count}, targetUserId=${targetUserId}, targetBot=${targetBot}`,
  );

  for (const [channelIdx, channel] of channels.entries()) {
    logger.debug(
      `[MsgDel][SVC] channel start: ${channel.name} (${channel.id})`,
    );
    // Bot のアクセス権チェック（サーバー全体対象時にスキップされた分）
    const me = channel.guild.members.me;
    if (
      me &&
      !channel
        .permissionsFor(me)
        ?.has([
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ])
    ) {
      logger.debug(
        `[MsgDel] チャンネル ${channel.name} はアクセス権なし、スキップ`,
      );
      continue;
    }

    const collected: Message[] = [];
    let lastId: string | undefined;
    let totalScanned = 0;

    // メッセージ収集（count の残り件数まで）
    let fetchBatchNum = 0;
    while (totalDeleted + collected.length < count) {
      fetchBatchNum++;
      logger.debug(
        `[MsgDel][SVC] fetch batch #${fetchBatchNum} ch=${channel.name} collected=${collected.length}`,
      );
      await report(
        `スキャン中... (${channelIdx + 1}/${channels.length}) ${channel.name} — ${totalScanned}件スキャン済`,
      );
      const batch: Collection<string, Message> = await channel.messages.fetch({
        limit: MSG_DEL_FETCH_BATCH_SIZE,
        ...(lastId ? { before: lastId } : {}),
      });

      logger.debug(
        `[MsgDel][SVC] fetch batch #${fetchBatchNum} got=${batch.size}`,
      );
      if (batch.size === 0) break;

      let batchOldestTs = Infinity;
      totalScanned += batch.size;

      for (const msg of batch.values()) {
        batchOldestTs = Math.min(batchOldestTs, msg.createdTimestamp);
        // 期間フィルター
        if (afterTs > 0 && msg.createdTimestamp < afterTs) continue;
        if (beforeTs !== Infinity && msg.createdTimestamp > beforeTs) continue;
        // ユーザーフィルター
        if (targetUserId && msg.author.id !== targetUserId) continue;
        // ボット・webhookフィルター（author.bot が true のメッセージのみ対象）
        if (targetBot && !msg.author.bot) continue;
        // キーワード部分一致フィルター（case-insensitive）
        if (
          keyword &&
          !msg.content.toLowerCase().includes(keyword.toLowerCase())
        )
          continue;
        collected.push(msg);
        if (totalDeleted + collected.length >= count) break;
      }

      lastId = batch.last()?.id;
      // フェッチ間の小ウェイト（APIレート制限への配慮）
      await sleep(200);
      // バッチ最古メッセージが afterTs より前なら、それ以降を取得しても範囲外なので打ち切り
      if (afterTs > 0 && batchOldestTs < afterTs) break;
      if (batch.size < MSG_DEL_FETCH_BATCH_SIZE) break;
    }

    logger.debug(
      `[MsgDel][SVC] channel ${channel.name}: collected=${collected.length}`,
    );
    if (collected.length === 0) continue;

    // 14日以内/以降に分類
    const newMsgs = collected.filter((m) => m.createdTimestamp > twoWeeksAgo);
    const oldMsgs = collected.filter((m) => m.createdTimestamp <= twoWeeksAgo);

    // 削除進捗ヘルパー
    const reportProgress = async (deleted: number, total: number) => {
      await report(
        `削除中... (${channel.name}) ${deleted} / ${total}件`,
        deleted === total,
      );
    };

    await reportProgress(0, collected.length);

    logger.debug(
      `[MsgDel][SVC] ch=${channel.name} newMsgs=${newMsgs.length} oldMsgs=${oldMsgs.length}`,
    );

    // bulkDelete（14日以内）
    for (let i = 0; i < newMsgs.length; i += MSG_DEL_BULK_BATCH_SIZE) {
      const chunk = newMsgs.slice(i, i + MSG_DEL_BULK_BATCH_SIZE);
      logger.debug(`[MsgDel][SVC] bulkDelete chunk size=${chunk.length}`);
      await (channel as import("discord.js").TextChannel).bulkDelete(
        chunk,
        true,
      );
      totalDeleted += chunk.length;
      await reportProgress(totalDeleted, collected.length);
      if (i + MSG_DEL_BULK_BATCH_SIZE < newMsgs.length) {
        await sleep(MSG_DEL_BULK_WAIT_MS);
      }
    }

    // 個別削除（14日以降）
    let channelDeleted = newMsgs.length;
    const deletedOldMsgs: Message[] = [];
    for (const msg of oldMsgs) {
      try {
        await msg.delete();
        totalDeleted++;
        channelDeleted++;
        deletedOldMsgs.push(msg);
      } catch (err) {
        logger.warn(
          `[MsgDel] メッセージ削除失敗 messageId=${msg.id}:`,
          String(err),
        );
      }
      await reportProgress(channelDeleted, collected.length);
      await sleep(MSG_DEL_INDIVIDUAL_WAIT_MS);
    }

    // 削除済みメッセージを記録（成功分のみ）
    const successfullyDeleted = [...newMsgs, ...deletedOldMsgs];
    for (const msg of successfullyDeleted) {
      const content = msg.content;
      deletedRecords.push({
        authorId: msg.author.id,
        authorTag: msg.author.tag,
        channelId: channel.id,
        channelName: channel.name,
        createdAt: msg.createdAt,
        content:
          content.slice(0, MSG_DEL_CONTENT_MAX_LENGTH) +
          (content.length > MSG_DEL_CONTENT_MAX_LENGTH ? "…" : ""),
      });
    }

    channelBreakdown[channel.name] = channelDeleted;
  }

  return { totalDeleted, channelBreakdown, deletedRecords };
}

/**
 * 日付文字列をパースして Date オブジェクトを返す。
 * `YYYY-MM-DD` のみの場合は時刻を補完する。
 */
export function parseDateStr(str: string, endOfDay: boolean): Date | null {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(str)
    ? `${str}T${endOfDay ? "23:59:59" : "00:00:00"}`
    : str;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/** スリープユーティリティ */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
