// src/shared/database/types.ts
// Database 関連の型定義

// ============================================================
// エンティティ型
// ============================================================

export interface GuildConfig {
  // guild 単位の主キー
  guildId: string;
  // i18n の既定ロケール
  locale: string;
  // 機能別JSON設定（未設定時は undefined）
  afkConfig?: AfkConfig;
  vacConfig?: VacConfig;
  bumpReminderConfig?: BumpReminderConfig;
  stickMessages?: StickMessage[];
  memberLogConfig?: MemberLogConfig;
  // DB監査用タイムスタンプ
  createdAt: Date;
  updatedAt: Date;
}

export interface AfkConfig {
  enabled: boolean;
  channelId?: string;
}

export interface VacConfig {
  enabled: boolean;
  triggerChannelIds: string[];
  createdChannels: VacChannelPair[];
}

export interface VacChannelPair {
  // 作成済み VC の実チャンネルID
  voiceChannelId: string;
  // その VC のオーナーユーザーID
  ownerId: string;
  // 作成時刻（epoch ms）
  createdAt: number;
}

export interface BumpReminderConfig {
  enabled: boolean;
  channelId?: string;
  mentionRoleId?: string;
  mentionUserIds: string[];
}

export const BUMP_REMINDER_MENTION_USER_MODE = {
  // メンション対象ユーザーを追加
  ADD: "add",
  // メンション対象ユーザーを削除
  REMOVE: "remove",
} as const;

export type BumpReminderMentionUserMode =
  (typeof BUMP_REMINDER_MENTION_USER_MODE)[keyof typeof BUMP_REMINDER_MENTION_USER_MODE];

export const BUMP_REMINDER_MENTION_ROLE_RESULT = {
  // ロール設定が更新された
  UPDATED: "updated",
  // 対象設定が未初期化/未構成
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionRoleResult =
  (typeof BUMP_REMINDER_MENTION_ROLE_RESULT)[keyof typeof BUMP_REMINDER_MENTION_ROLE_RESULT];

export const BUMP_REMINDER_MENTION_USER_ADD_RESULT = {
  // 追加成功
  ADDED: "added",
  // 既に登録済み
  ALREADY_EXISTS: "already-exists",
  // 対象設定が未初期化/未構成
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionUserAddResult =
  (typeof BUMP_REMINDER_MENTION_USER_ADD_RESULT)[keyof typeof BUMP_REMINDER_MENTION_USER_ADD_RESULT];

export const BUMP_REMINDER_MENTION_USER_REMOVE_RESULT = {
  // 削除成功
  REMOVED: "removed",
  // 削除対象が存在しない
  NOT_FOUND: "not-found",
  // 対象設定が未初期化/未構成
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionUserRemoveResult =
  (typeof BUMP_REMINDER_MENTION_USER_REMOVE_RESULT)[keyof typeof BUMP_REMINDER_MENTION_USER_REMOVE_RESULT];

export const BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT = {
  // ユーザー一覧をクリアした
  CLEARED: "cleared",
  // もともと空で変更なし
  ALREADY_EMPTY: "already-empty",
  // 対象設定が未初期化/未構成
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionUsersClearResult =
  (typeof BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT)[keyof typeof BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT];

export const BUMP_REMINDER_MENTION_CLEAR_RESULT = {
  // ロール・ユーザーをまとめてクリアした
  CLEARED: "cleared",
  // もともと未設定で変更なし
  ALREADY_CLEARED: "already-cleared",
  // 対象設定が未初期化/未構成
  NOT_CONFIGURED: "not-configured",
} as const;

export type BumpReminderMentionClearResult =
  (typeof BUMP_REMINDER_MENTION_CLEAR_RESULT)[keyof typeof BUMP_REMINDER_MENTION_CLEAR_RESULT];

export interface StickMessage {
  // 固定対象のテキストチャンネル
  channelId: string;
  // 固定メッセージ本体
  messageId: string;
}

export interface MemberLogConfig {
  // 機能有効フラグ
  enabled: boolean;
  // 参加/退出ログ送信先
  channelId?: string;
  // カスタム参加メッセージ（{user}/{username}/{count} 置換可）
  joinMessage?: string;
  // カスタム退出メッセージ（{user}/{username}/{count} 置換可）
  leaveMessage?: string;
}

// ============================================================
// 機能別リポジトリインターフェース（必要な範囲だけ依存できる）
// ============================================================

export interface IBaseGuildRepository {
  getConfig(guildId: string): Promise<GuildConfig | null>;
  saveConfig(config: GuildConfig): Promise<void>;
  updateConfig(guildId: string, updates: Partial<GuildConfig>): Promise<void>;
  deleteConfig(guildId: string): Promise<void>;
  exists(guildId: string): Promise<boolean>;
  getLocale(guildId: string): Promise<string>;
  updateLocale(guildId: string, locale: string): Promise<void>;
}

export interface IAfkRepository {
  getAfkConfig(guildId: string): Promise<AfkConfig | null>;
  setAfkChannel(guildId: string, channelId: string): Promise<void>;
  updateAfkConfig(guildId: string, afkConfig: AfkConfig): Promise<void>;
}

export interface IBumpReminderConfigRepository {
  getBumpReminderConfig(guildId: string): Promise<BumpReminderConfig | null>;
  setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void>;
  updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void>;
  setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult>;
  addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult>;
  removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult>;
  clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult>;
  clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult>;
}

export interface IVacRepository {
  getVacConfig(guildId: string): Promise<VacConfig | null>;
  updateVacConfig(guildId: string, vacConfig: VacConfig): Promise<void>;
}

export interface IStickMessageRepository {
  getStickMessages(guildId: string): Promise<StickMessage[]>;
  updateStickMessages(
    guildId: string,
    stickMessages: StickMessage[],
  ): Promise<void>;
}

export interface IMemberLogRepository {
  getMemberLogConfig(guildId: string): Promise<MemberLogConfig | null>;
  updateMemberLogConfig(
    guildId: string,
    memberLogConfig: MemberLogConfig,
  ): Promise<void>;
}

// ============================================================
// MessageDeleteUserSetting エンティティ（message-delete 機能のユーザー個別設定）
// ============================================================

export interface MessageDeleteUserSetting {
  id: string;
  userId: string;
  guildId: string;
  /** message-delete 実行確認ダイアログをスキップするか（デフォルト: false） */
  skipConfirm: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDeleteUserSettingRepository {
  findByUserAndGuild(
    userId: string,
    guildId: string,
  ): Promise<MessageDeleteUserSetting | null>;
  upsert(
    userId: string,
    guildId: string,
    patch: { skipConfirm: boolean },
  ): Promise<MessageDeleteUserSetting>;
}

// ============================================================
// StickyMessage エンティティ（専用テーブル、GuildConfig とは別）
// ============================================================

export interface StickyMessage {
  id: string;
  guildId: string;
  channelId: string;
  content: string;
  embedData: string | null; // JSON 文字列
  updatedBy: string | null; // 最終設定・更新者の Discord ユーザーID
  lastMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStickyMessageRepository {
  findByChannel(channelId: string): Promise<StickyMessage | null>;
  findAllByGuild(guildId: string): Promise<StickyMessage[]>;
  create(
    guildId: string,
    channelId: string,
    content: string,
    embedData?: string,
    updatedBy?: string,
  ): Promise<StickyMessage>;
  updateLastMessageId(id: string, lastMessageId: string): Promise<void>;
  updateContent(
    id: string,
    content: string,
    embedData: string | null,
    updatedBy?: string,
  ): Promise<StickyMessage>;
  delete(id: string): Promise<void>;
  deleteByChannel(channelId: string): Promise<void>;
}

/**
 * 全機能を束ねた統合インターフェース
 */
export interface IGuildConfigRepository
  extends
    IBaseGuildRepository,
    IAfkRepository,
    IBumpReminderConfigRepository,
    IVacRepository,
    IStickMessageRepository,
    IMemberLogRepository {}
