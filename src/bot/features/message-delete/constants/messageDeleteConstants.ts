// src/bot/features/message-delete/constants/messageDeleteConstants.ts
// message-delete 機能の定数・型定義

/** UI コンポーネントの customId 定数 */
export const MSG_DEL_CUSTOM_ID = {
  // 確認ダイアログ
  CONFIRM_YES: "msgdel_confirm_yes",
  CONFIRM_NO: "msgdel_confirm_no",
  CONFIRM_SKIP_TOGGLE: "msgdel_confirm_skip_toggle",
  // ページネイション
  PREV: "msgdel_prev",
  NEXT: "msgdel_next",
  // フィルター
  FILTER_AUTHOR: "msgdel_filter_author",
  FILTER_KEYWORD: "msgdel_filter_keyword",
  FILTER_DAYS: "msgdel_filter_days",
  FILTER_AFTER: "msgdel_filter_after",
  FILTER_BEFORE: "msgdel_filter_before",
  FILTER_RESET: "msgdel_filter_reset",
  // フィルターモーダル
  MODAL_KEYWORD: "msgdel_modal_keyword",
  MODAL_DAYS: "msgdel_modal_days",
  MODAL_AFTER: "msgdel_modal_after",
  MODAL_BEFORE: "msgdel_modal_before",
  // モーダル入力フィールド
  MODAL_INPUT_KEYWORD: "msgdel_modal_input_keyword",
  MODAL_INPUT_DAYS: "msgdel_modal_input_days",
  MODAL_INPUT_AFTER: "msgdel_modal_input_after",
  MODAL_INPUT_BEFORE: "msgdel_modal_input_before",
} as const;

/** 1ページあたりの表示件数 */
export const MSG_DEL_PAGE_SIZE = 5;

/** 確認ダイアログのタイムアウト（60秒） */
export const MSG_DEL_CONFIRM_TIMEOUT_MS = 60_000;

/** ページネイションのタイムアウト（15分） */
export const MSG_DEL_PAGINATION_TIMEOUT_MS = 15 * 60 * 1000;

/** bulkDelete 1バッチあたりの最大件数 */
export const MSG_DEL_BULK_BATCH_SIZE = 100;

/** メッセージ取得 1バッチあたりの最大件数 */
export const MSG_DEL_FETCH_BATCH_SIZE = 100;

/** bulkDelete バッチ間の待機時間（ms） */
export const MSG_DEL_BULK_WAIT_MS = 1000;

/** 個別削除 1件あたりの待機時間（ms） */
export const MSG_DEL_INDIVIDUAL_WAIT_MS = 500;

/** Discord の bulkDelete 対象となる最大メッセージ年齢（14日） */
export const MSG_DEL_BULK_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** 削除結果メッセージの本文最大文字数 */
export const MSG_DEL_CONTENT_MAX_LENGTH = 200;

/** コマンド名定数 */
export const MSG_DEL_COMMAND = {
  NAME: "message-delete",
  OPTION: {
    COUNT: "count",
    USER: "user",
    BOT: "bot",
    KEYWORD: "keyword",
    DAYS: "days",
    AFTER: "after",
    BEFORE: "before",
    CHANNEL: "channel",
  },
} as const;

/** message-delete-config コマンド名定数 */
export const MSG_DEL_CONFIG_COMMAND = {
  NAME: "message-delete-config",
  OPTION: {
    CONFIRM: "confirm",
  },
} as const;

/** 削除済みメッセージの記録型 */
export interface DeletedMessageRecord {
  authorId: string;
  authorTag: string;
  channelId: string;
  channelName: string;
  createdAt: Date;
  content: string;
}

/** フィルター状態型 */
export interface MessageDeleteFilter {
  authorId?: string;
  keyword?: string;
  /** 過去N日間フィルター（after/before と排他） */
  days?: number;
  /** after 日時フィルター */
  after?: Date;
  /** before 日時フィルター */
  before?: Date;
}
