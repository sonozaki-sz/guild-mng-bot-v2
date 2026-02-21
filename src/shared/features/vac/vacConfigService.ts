// src/shared/features/vac/vacConfigService.ts
// VAC設定のサービス実装（Repositoryパターン準拠）

import {
  getGuildConfigRepository,
  type IVacRepository,
  type VacChannelPair,
  type VacConfig,
} from "../../database";

export const DEFAULT_VAC_CONFIG: VacConfig = {
  enabled: false,
  triggerChannelIds: [],
  createdChannels: [],
};

// VAC設定サービスのシングルトンキャッシュ
let vacConfigService: VacConfigService | undefined;
let cachedRepository: IVacRepository | undefined;

/**
 * VAC設定の初期値を生成する
 */
function createDefaultVacConfig(): VacConfig {
  // 既定値をもとに空配列を持つ新規設定を生成する
  return {
    enabled: DEFAULT_VAC_CONFIG.enabled,
    triggerChannelIds: [],
    createdChannels: [],
  };
}

/**
 * VAC設定を正規化し、配列参照を分離する
 */
function normalizeVacConfig(config: VacConfig): VacConfig {
  // 可変配列を複製して設定オブジェクトを正規化する
  return {
    enabled: config.enabled,
    triggerChannelIds: [...config.triggerChannelIds],
    createdChannels: [...config.createdChannels],
  };
}

/**
 * 指定VCが管理対象に含まれるか判定する
 */
function hasCreatedChannel(config: VacConfig, voiceChannelId: string): boolean {
  // 管理対象VC一覧に対象IDが存在するかを返す
  return config.createdChannels.some(
    (item) => item.voiceChannelId === voiceChannelId,
  );
}

/**
 * VAC設定の取得・更新を担当するサービス
 * DBアクセスは IVacRepository 経由に統一する
 */
export class VacConfigService {
  constructor(private readonly guildConfigRepository: IVacRepository) {}

  /**
   * VAC設定を取得（未設定時は初期値を返す）
   */
  async getVacConfigOrDefault(guildId: string): Promise<VacConfig> {
    // まず永続化設定を取得
    const config = await this.guildConfigRepository.getVacConfig(guildId);
    // 未設定時は呼び出し側で null 判定不要なよう既定値を返す
    if (!config) {
      return createDefaultVacConfig();
    }

    // 呼び出し側で配列参照が共有されないよう正規化して返す
    return normalizeVacConfig(config);
  }

  /**
   * VAC設定を永続化する
   */
  async saveVacConfig(guildId: string, config: VacConfig): Promise<void> {
    // 保存前に配列を複製し、参照共有による副作用を防ぐ
    await this.guildConfigRepository.updateVacConfig(
      guildId,
      normalizeVacConfig(config),
    );
  }

  /**
   * トリガーチャンネルを追加し、VACを有効化する
   */
  async addTriggerChannel(
    guildId: string,
    channelId: string,
  ): Promise<VacConfig> {
    // 現在設定を取得し、差分がある場合のみ永続化する
    const config = await this.getVacConfigOrDefault(guildId);
    let updated = false;

    // 重複登録を避けてトリガー一覧へ追加
    if (!config.triggerChannelIds.includes(channelId)) {
      config.triggerChannelIds.push(channelId);
      updated = true;
    }

    // トリガー追加時は機能を有効化
    if (!config.enabled) {
      config.enabled = true;
      updated = true;
    }

    if (updated) {
      await this.saveVacConfig(guildId, config);
    }

    return config;
  }

  /**
   * トリガーチャンネルを設定から削除する
   */
  async removeTriggerChannel(
    guildId: string,
    channelId: string,
  ): Promise<VacConfig> {
    // 対象ID除去前後で件数を比較し、変化時のみ保存
    const config = await this.getVacConfigOrDefault(guildId);
    const previousLength = config.triggerChannelIds.length;
    config.triggerChannelIds = config.triggerChannelIds.filter(
      (id) => id !== channelId,
    );

    if (config.triggerChannelIds.length !== previousLength) {
      await this.saveVacConfig(guildId, config);
    }

    return config;
  }

  /**
   * 管理対象VC（自動作成VC）を設定に登録する
   */
  async addCreatedVacChannel(
    guildId: string,
    channel: VacChannelPair,
  ): Promise<VacConfig> {
    // 同一VCの二重登録を避けて管理対象へ追加
    const config = await this.getVacConfigOrDefault(guildId);
    const exists = hasCreatedChannel(config, channel.voiceChannelId);
    if (!exists) {
      config.createdChannels.push(channel);
      await this.saveVacConfig(guildId, config);
    }
    return config;
  }

  /**
   * 管理対象VC（自動作成VC）を設定から削除する
   */
  async removeCreatedVacChannel(
    guildId: string,
    voiceChannelId: string,
  ): Promise<VacConfig> {
    // 対象VC除去前後で件数を比較し、変化時のみ保存
    const config = await this.getVacConfigOrDefault(guildId);
    const previousLength = config.createdChannels.length;
    config.createdChannels = config.createdChannels.filter(
      (item) => item.voiceChannelId !== voiceChannelId,
    );

    if (config.createdChannels.length !== previousLength) {
      await this.saveVacConfig(guildId, config);
    }

    return config;
  }

  /**
   * 指定VCがVAC管理下か判定する
   */
  async isManagedVacChannel(
    guildId: string,
    voiceChannelId: string,
  ): Promise<boolean> {
    // 管理対象判定のみ必要なため、設定取得して presence を確認
    const config = await this.guildConfigRepository.getVacConfig(guildId);
    if (!config) {
      return false;
    }
    return hasCreatedChannel(config, voiceChannelId);
  }
}

/**
 * VAC設定サービスを依存注入で生成する
 */
export function createVacConfigService(
  repository: IVacRepository,
): VacConfigService {
  return new VacConfigService(repository);
}

/**
 * VAC設定サービスのシングルトンを取得する
 */
export function getVacConfigService(
  repository?: IVacRepository,
): VacConfigService {
  // 引数優先で repository を解決し、同一インスタンスなら既存 service を再利用
  const resolvedRepository = repository ?? getGuildConfigRepository();
  if (!vacConfigService || cachedRepository !== resolvedRepository) {
    vacConfigService = createVacConfigService(resolvedRepository);
    cachedRepository = resolvedRepository;
  }
  return vacConfigService;
}

/**
 * VAC設定を取得（未設定時は初期値を返す）
 */
export async function getVacConfigOrDefault(
  guildId: string,
): Promise<VacConfig> {
  // 関数APIはシングルトンサービスへ委譲
  return getVacConfigService().getVacConfigOrDefault(guildId);
}

/**
 * VAC設定を永続化する
 */
export async function saveVacConfig(
  guildId: string,
  config: VacConfig,
): Promise<void> {
  // 関数APIはシングルトンサービスへ委譲
  await getVacConfigService().saveVacConfig(guildId, config);
}

/**
 * トリガーチャンネルを追加し、VACを有効化する
 */
export async function addTriggerChannel(
  guildId: string,
  channelId: string,
): Promise<VacConfig> {
  // 関数APIはシングルトンサービスへ委譲
  return getVacConfigService().addTriggerChannel(guildId, channelId);
}

/**
 * トリガーチャンネルを設定から削除する
 */
export async function removeTriggerChannel(
  guildId: string,
  channelId: string,
): Promise<VacConfig> {
  // 関数APIはシングルトンサービスへ委譲
  return getVacConfigService().removeTriggerChannel(guildId, channelId);
}

/**
 * 管理対象VC（自動作成VC）を設定に登録する
 */
export async function addCreatedVacChannel(
  guildId: string,
  channel: VacChannelPair,
): Promise<VacConfig> {
  // 関数APIはシングルトンサービスへ委譲
  return getVacConfigService().addCreatedVacChannel(guildId, channel);
}

/**
 * 管理対象VC（自動作成VC）を設定から削除する
 */
export async function removeCreatedVacChannel(
  guildId: string,
  voiceChannelId: string,
): Promise<VacConfig> {
  // 関数APIはシングルトンサービスへ委譲
  return getVacConfigService().removeCreatedVacChannel(guildId, voiceChannelId);
}

/**
 * 指定VCがVAC管理下か判定する
 */
export async function isManagedVacChannel(
  guildId: string,
  voiceChannelId: string,
): Promise<boolean> {
  // 関数APIはシングルトンサービスへ委譲
  return getVacConfigService().isManagedVacChannel(guildId, voiceChannelId);
}
