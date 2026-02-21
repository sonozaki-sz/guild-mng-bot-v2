// src/shared/features/bump-reminder/bumpReminderConfigService.ts
// Bumpリマインダー設定サービス実装（Repositoryパターン準拠）

import {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  getGuildConfigRepository,
  type BumpReminderConfig,
  type BumpReminderMentionClearResult,
  type BumpReminderMentionRoleResult,
  type BumpReminderMentionUserAddResult,
  type BumpReminderMentionUserRemoveResult,
  type BumpReminderMentionUsersClearResult,
  type IBumpReminderConfigRepository,
} from "../../database";

export {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
};

export type {
  BumpReminderConfig,
  BumpReminderMentionClearResult,
  BumpReminderMentionRoleResult,
  BumpReminderMentionUserAddResult,
  BumpReminderMentionUserRemoveResult,
  BumpReminderMentionUsersClearResult,
};

export const DEFAULT_BUMP_REMINDER_CONFIG: BumpReminderConfig = {
  enabled: false,
  mentionUserIds: [],
};

let bumpReminderConfigService: BumpReminderConfigService | undefined;
let cachedRepository: IBumpReminderConfigRepository | undefined;

/**
 * Bumpリマインダー設定の初期値を生成する
 */
function createDefaultBumpReminderConfig(): BumpReminderConfig {
  // 既定値から新しい設定オブジェクトを都度生成して返す
  return {
    enabled: DEFAULT_BUMP_REMINDER_CONFIG.enabled,
    channelId: DEFAULT_BUMP_REMINDER_CONFIG.channelId,
    mentionRoleId: DEFAULT_BUMP_REMINDER_CONFIG.mentionRoleId,
    mentionUserIds: [],
  };
}

/**
 * Bumpリマインダー設定を正規化し、配列参照を分離する
 */
function normalizeBumpReminderConfig(
  config: BumpReminderConfig,
): BumpReminderConfig {
  // 配列を複製して呼び出し元との参照共有を防ぐ
  return {
    enabled: config.enabled,
    channelId: config.channelId,
    mentionRoleId: config.mentionRoleId,
    mentionUserIds: [...config.mentionUserIds],
  };
}

/**
 * Bumpリマインダー設定の取得・更新を担当するサービス
 */
export class BumpReminderConfigService {
  constructor(
    private readonly guildConfigRepository: IBumpReminderConfigRepository,
  ) {}

  /**
   * Bumpリマインダー設定を取得する
   */
  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    // 永続化設定を取得
    const config =
      await this.guildConfigRepository.getBumpReminderConfig(guildId);
    // 未設定時は null を返し、呼び出し側に初期化判断を委ねる
    if (!config) {
      return null;
    }
    // 配列参照共有を避けるため正規化して返す
    return normalizeBumpReminderConfig(config);
  }

  /**
   * Bumpリマインダー設定を取得（未設定時は初期値を返す）
   */
  async getBumpReminderConfigOrDefault(
    guildId: string,
  ): Promise<BumpReminderConfig> {
    // 設定がなければ既定値を返し、呼び出し側の null 判定を不要化
    const config = await this.getBumpReminderConfig(guildId);
    if (!config) {
      return createDefaultBumpReminderConfig();
    }
    return config;
  }

  /**
   * Bumpリマインダー設定を永続化する
   */
  async saveBumpReminderConfig(
    guildId: string,
    config: BumpReminderConfig,
  ): Promise<void> {
    // 保存前に正規化して副作用のある参照共有を防止
    await this.guildConfigRepository.updateBumpReminderConfig(
      guildId,
      normalizeBumpReminderConfig(config),
    );
  }

  /**
   * Bumpリマインダー機能の有効状態を更新する
   */
  async setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void> {
    // enabled と channelId の更新責務は repository 実装へ委譲
    await this.guildConfigRepository.setBumpReminderEnabled(
      guildId,
      enabled,
      channelId,
    );
  }

  /**
   * メンション対象ロールを設定する
   */
  async setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult> {
    return this.guildConfigRepository.setBumpReminderMentionRole(
      guildId,
      roleId,
    );
  }

  /**
   * メンション対象ユーザーを追加する
   */
  async addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult> {
    return this.guildConfigRepository.addBumpReminderMentionUser(
      guildId,
      userId,
    );
  }

  /**
   * メンション対象ユーザーを削除する
   */
  async removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult> {
    return this.guildConfigRepository.removeBumpReminderMentionUser(
      guildId,
      userId,
    );
  }

  /**
   * メンション対象ユーザー一覧をクリアする
   */
  async clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult> {
    return this.guildConfigRepository.clearBumpReminderMentionUsers(guildId);
  }

  /**
   * ロール・ユーザー両方のメンション設定をクリアする
   */
  async clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult> {
    return this.guildConfigRepository.clearBumpReminderMentions(guildId);
  }
}

/**
 * Bumpリマインダー設定サービスを依存注入で生成する
 */
export function createBumpReminderConfigService(
  repository: IBumpReminderConfigRepository,
): BumpReminderConfigService {
  return new BumpReminderConfigService(repository);
}

/**
 * Bumpリマインダー設定サービスのシングルトンを取得する
 */
export function getBumpReminderConfigService(
  repository?: IBumpReminderConfigRepository,
): BumpReminderConfigService {
  // 引数優先で repository を解決し、同一依存なら service を再利用
  const resolvedRepository = repository ?? getGuildConfigRepository();
  if (!bumpReminderConfigService || cachedRepository !== resolvedRepository) {
    bumpReminderConfigService =
      createBumpReminderConfigService(resolvedRepository);
    cachedRepository = resolvedRepository;
  }
  return bumpReminderConfigService;
}

/**
 * Bumpリマインダー設定を取得する
 */
export async function getBumpReminderConfig(
  guildId: string,
): Promise<BumpReminderConfig | null> {
  // 関数APIはシングルトンサービスへ委譲
  return getBumpReminderConfigService().getBumpReminderConfig(guildId);
}

/**
 * Bumpリマインダー設定を取得（未設定時は初期値を返す）
 */
export async function getBumpReminderConfigOrDefault(
  guildId: string,
): Promise<BumpReminderConfig> {
  // 関数APIはシングルトンサービスへ委譲
  return getBumpReminderConfigService().getBumpReminderConfigOrDefault(guildId);
}

/**
 * Bumpリマインダー設定を永続化する
 */
export async function saveBumpReminderConfig(
  guildId: string,
  config: BumpReminderConfig,
): Promise<void> {
  // 関数APIはシングルトンサービスへ委譲
  await getBumpReminderConfigService().saveBumpReminderConfig(guildId, config);
}

/**
 * Bumpリマインダー機能の有効状態を更新する
 */
export async function setBumpReminderEnabled(
  guildId: string,
  enabled: boolean,
  channelId?: string,
): Promise<void> {
  // 関数APIはシングルトンサービスへ委譲
  await getBumpReminderConfigService().setBumpReminderEnabled(
    guildId,
    enabled,
    channelId,
  );
}

/**
 * メンション対象ロールを設定する
 */
export async function setBumpReminderMentionRole(
  guildId: string,
  roleId: string | undefined,
): Promise<BumpReminderMentionRoleResult> {
  // 関数APIはシングルトンサービスへ委譲
  return getBumpReminderConfigService().setBumpReminderMentionRole(
    guildId,
    roleId,
  );
}

/**
 * メンション対象ユーザーを追加する
 */
export async function addBumpReminderMentionUser(
  guildId: string,
  userId: string,
): Promise<BumpReminderMentionUserAddResult> {
  // 関数APIはシングルトンサービスへ委譲
  return getBumpReminderConfigService().addBumpReminderMentionUser(
    guildId,
    userId,
  );
}

/**
 * メンション対象ユーザーを削除する
 */
export async function removeBumpReminderMentionUser(
  guildId: string,
  userId: string,
): Promise<BumpReminderMentionUserRemoveResult> {
  // 関数APIはシングルトンサービスへ委譲
  return getBumpReminderConfigService().removeBumpReminderMentionUser(
    guildId,
    userId,
  );
}

/**
 * メンション対象ユーザー一覧をクリアする
 */
export async function clearBumpReminderMentionUsers(
  guildId: string,
): Promise<BumpReminderMentionUsersClearResult> {
  // 関数APIはシングルトンサービスへ委譲
  return getBumpReminderConfigService().clearBumpReminderMentionUsers(guildId);
}

/**
 * ロール・ユーザー両方のメンション設定をクリアする
 */
export async function clearBumpReminderMentions(
  guildId: string,
): Promise<BumpReminderMentionClearResult> {
  // 関数APIはシングルトンサービスへ委譲
  return getBumpReminderConfigService().clearBumpReminderMentions(guildId);
}
