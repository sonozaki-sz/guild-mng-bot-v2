// src/shared/features/vac/index.ts
// VAC機能の標準エントリーポイント

// 外部公開 API（VAC設定取得/更新ユースケース）
export {
  DEFAULT_VAC_CONFIG,
  VacConfigService,
  addCreatedVacChannel,
  addTriggerChannel,
  createVacConfigService,
  getVacConfigOrDefault,
  getVacConfigService,
  isManagedVacChannel,
  removeCreatedVacChannel,
  removeTriggerChannel,
  saveVacConfig,
} from "./vacConfigService";
