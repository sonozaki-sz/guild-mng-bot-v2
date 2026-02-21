// src/bot/features/vac/repositories/vacRepository.ts
// VAC機能向けの永続化アクセスリポジトリ

import {
  type VacChannelPair,
  type VacConfig,
} from "../../../../shared/database/types";
import {
  getVacConfigService,
  type VacConfigService,
} from "../../../../shared/features/vac/vacConfigService";

/**
 * VAC 機能が必要とする永続化アクセスの抽象
 */
export interface IVacRepository {
  getVacConfigOrDefault(guildId: string): Promise<VacConfig>;
  saveVacConfig(guildId: string, config: VacConfig): Promise<void>;
  addTriggerChannel(guildId: string, channelId: string): Promise<VacConfig>;
  removeTriggerChannel(guildId: string, channelId: string): Promise<VacConfig>;
  addCreatedVacChannel(
    guildId: string,
    channel: VacChannelPair,
  ): Promise<VacConfig>;
  removeCreatedVacChannel(
    guildId: string,
    voiceChannelId: string,
  ): Promise<VacConfig>;
  isManagedVacChannel(
    guildId: string,
    voiceChannelId: string,
  ): Promise<boolean>;
}

type VacConfigServicePort = Pick<
  VacConfigService,
  | "getVacConfigOrDefault"
  | "saveVacConfig"
  | "addTriggerChannel"
  | "removeTriggerChannel"
  | "addCreatedVacChannel"
  | "removeCreatedVacChannel"
  | "isManagedVacChannel"
>;

/**
 * VAC設定サービスを注入して VAC リポジトリを生成する
 */
export function createVacRepository(
  vacConfigService: VacConfigServicePort,
): IVacRepository {
  return {
    getVacConfigOrDefault: (guildId) =>
      vacConfigService.getVacConfigOrDefault(guildId),
    saveVacConfig: (guildId, config) =>
      vacConfigService.saveVacConfig(guildId, config),
    addTriggerChannel: (guildId, channelId) =>
      vacConfigService.addTriggerChannel(guildId, channelId),
    removeTriggerChannel: (guildId, channelId) =>
      vacConfigService.removeTriggerChannel(guildId, channelId),
    addCreatedVacChannel: (guildId, channel) =>
      vacConfigService.addCreatedVacChannel(guildId, channel),
    removeCreatedVacChannel: (guildId, voiceChannelId) =>
      vacConfigService.removeCreatedVacChannel(guildId, voiceChannelId),
    isManagedVacChannel: (guildId, voiceChannelId) =>
      vacConfigService.isManagedVacChannel(guildId, voiceChannelId),
  };
}

/**
 * 共有VAC設定サービスから既定リポジトリを生成する
 * @returns 既定のVACリポジトリ
 */
function createDefaultVacRepository(): IVacRepository {
  const vacConfigService = getVacConfigService();
  return createVacRepository(vacConfigService);
}

let vacRepository: IVacRepository | undefined;

/**
 * VAC リポジトリのシングルトンを取得する
 */
export function getVacRepository(repository?: IVacRepository): IVacRepository {
  // テスト時は外部注入リポジトリを優先
  if (repository) {
    vacRepository = repository;
    return vacRepository;
  }

  // 通常実行時は遅延初期化シングルトンを返す
  if (!vacRepository) {
    vacRepository = createDefaultVacRepository();
  }

  return vacRepository;
}
