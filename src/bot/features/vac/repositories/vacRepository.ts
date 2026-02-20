// src/bot/features/vac/repositories/vacRepository.ts
// VAC機能向けの永続化アクセスリポジトリ

import type { VacChannelPair, VacConfig } from "../../../../shared/database";
import {
  addCreatedVacChannel,
  addTriggerChannel,
  getVacConfigOrDefault,
  isManagedVacChannel,
  removeCreatedVacChannel,
  removeTriggerChannel,
  saveVacConfig,
} from "../../../../shared/features/vac";

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

function createVacRepository(): IVacRepository {
  return {
    getVacConfigOrDefault,
    saveVacConfig,
    addTriggerChannel,
    removeTriggerChannel,
    addCreatedVacChannel,
    removeCreatedVacChannel,
    isManagedVacChannel,
  };
}

let vacRepository: IVacRepository | undefined;

/**
 * VAC リポジトリのシングルトンを取得する
 */
export function getVacRepository(repository?: IVacRepository): IVacRepository {
  // テスト時は外部注入リポジトリを優先
  if (repository) {
    return repository;
  }

  // 通常実行時は遅延初期化シングルトンを返す
  if (!vacRepository) {
    vacRepository = createVacRepository();
  }

  return vacRepository;
}
