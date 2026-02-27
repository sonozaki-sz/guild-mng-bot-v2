// src/shared/features/afk/afkConfigService.ts
// AFK設定サービス実装（Repositoryパターン準拠）

import { getGuildConfigRepository } from "../../database/guildConfigRepositoryProvider";
import { type AfkConfig, type IAfkRepository } from "../../database/types";
import { tDefault } from "../../locale/localeManager";
import { executeWithDatabaseError } from "../../utils/errorHandling";
import { logger } from "../../utils/logger";

export type { AfkConfig };

export const DEFAULT_AFK_CONFIG: AfkConfig = {
  enabled: false,
};

// AFK設定サービスのシングルトンキャッシュ
let afkConfigService: AfkConfigService | undefined;
let cachedRepository: IAfkRepository | undefined;

/**
 * AFK設定の初期値を生成する
 */
function createDefaultAfkConfig(): AfkConfig {
  // 既定値から新しい設定オブジェクトを都度生成して返す
  return {
    enabled: DEFAULT_AFK_CONFIG.enabled,
  };
}

/**
 * AFK設定を正規化して返す
 */
function normalizeAfkConfig(config: AfkConfig): AfkConfig {
  // 呼び出し元との参照共有を防ぐためコピーを返す
  return {
    enabled: config.enabled,
    channelId: config.channelId,
  };
}

/**
 * AFK設定の取得・更新を担当するサービス
 * DBアクセスは IAfkRepository 経由に統一する
 */
export class AfkConfigService {
  constructor(private readonly guildConfigRepository: IAfkRepository) {}

  /**
   * AFK設定を取得する
   */
  async getAfkConfig(guildId: string): Promise<AfkConfig | null> {
    // 永続化設定を取得
    const config = await this.guildConfigRepository.getAfkConfig(guildId);
    // 未設定時は null を返し、呼び出し側に初期化判断を委ねる
    if (!config) {
      return null;
    }
    // 参照共有を避けるため正規化して返す
    return normalizeAfkConfig(config);
  }

  /**
   * AFK設定を取得（未設定時は初期値を返す）
   */
  async getAfkConfigOrDefault(guildId: string): Promise<AfkConfig> {
    // 設定がなければ既定値を返し、呼び出し側の null 判定を不要化
    const config = await this.getAfkConfig(guildId);
    if (!config) {
      return createDefaultAfkConfig();
    }
    return config;
  }

  /**
   * AFK設定を永続化する
   */
  async saveAfkConfig(guildId: string, config: AfkConfig): Promise<void> {
    return executeWithDatabaseError(async () => {
      // 保存前に正規化して副作用のある参照共有を防止
      await this.guildConfigRepository.updateAfkConfig(
        guildId,
        normalizeAfkConfig(config),
      );
      logger.debug(tDefault("system:database.afk_config_saved", { guildId }));
    }, tDefault("system:database.afk_config_save_failed", { guildId }));
  }

  /**
   * AFKチャンネルを設定し、AFK機能を有効化する
   */
  async setAfkChannel(guildId: string, channelId: string): Promise<void> {
    return executeWithDatabaseError(async () => {
      // チャンネル設定とAFK有効化は repository 実装へ委譲
      await this.guildConfigRepository.setAfkChannel(guildId, channelId);
      logger.debug(
        tDefault("system:database.afk_channel_set", { guildId, channelId }),
      );
    }, tDefault("system:database.afk_channel_set_failed", { guildId, channelId }));
  }
}

/**
 * AFK設定サービスを依存注入で生成する
 */
export function createAfkConfigService(
  repository: IAfkRepository,
): AfkConfigService {
  return new AfkConfigService(repository);
}

/**
 * AFK設定サービスのシングルトンを取得する
 */
export function getAfkConfigService(
  repository?: IAfkRepository,
): AfkConfigService {
  // 引数優先で repository を解決し、同一インスタンスなら既存 service を再利用
  const resolvedRepository = repository ?? getGuildConfigRepository();
  if (!afkConfigService || cachedRepository !== resolvedRepository) {
    afkConfigService = createAfkConfigService(resolvedRepository);
    cachedRepository = resolvedRepository;
  }
  return afkConfigService;
}

/**
 * AFK設定を取得する
 */
export async function getAfkConfig(guildId: string): Promise<AfkConfig | null> {
  // 関数APIはシングルトンサービスへ委譲
  return getAfkConfigService().getAfkConfig(guildId);
}

/**
 * AFK設定を取得（未設定時は初期値を返す）
 */
export async function getAfkConfigOrDefault(
  guildId: string,
): Promise<AfkConfig> {
  // 関数APIはシングルトンサービスへ委譲
  return getAfkConfigService().getAfkConfigOrDefault(guildId);
}

/**
 * AFK設定を永続化する
 */
export async function saveAfkConfig(
  guildId: string,
  config: AfkConfig,
): Promise<void> {
  // 関数APIはシングルトンサービスへ委譲
  await getAfkConfigService().saveAfkConfig(guildId, config);
}

/**
 * AFKチャンネルを設定し、AFK機能を有効化する
 */
export async function setAfkChannel(
  guildId: string,
  channelId: string,
): Promise<void> {
  // 関数APIはシングルトンサービスへ委譲
  await getAfkConfigService().setAfkChannel(guildId, channelId);
}
