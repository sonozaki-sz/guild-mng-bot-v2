// src/bot/features/bump-reminder/index.ts
// Bumpリマインダー機能の公開エントリーポイント
// Bot 層からの import 先をこのファイルに一本化する

// 機能定数・型ガード・変換ヘルパー
export {
  BUMP_COMMANDS,
  BUMP_CONSTANTS,
  BUMP_DETECTION_RULES,
  BUMP_REMINDER_STATUS,
  BUMP_SERVICES,
  getReminderDelayMinutes,
  isBumpServiceName,
  resolveBumpService,
  toBumpReminderJobId,
  toScheduledAt,
  type BumpReminderStatus,
  type BumpServiceName,
} from "./constants";

// スケジューリング/復元を担うマネージャー
export {
  BumpReminderManager,
  createBumpReminderFeatureConfigService,
  getBumpReminderFeatureConfigService,
  getBumpReminderManager,
  type BumpReminderTaskFactory,
} from "./services";

// 永続化アクセス（Prisma実装 + 抽象）
export {
  BumpReminderRepository,
  getBumpReminderRepository,
  type BumpReminder,
  type IBumpReminderRepository,
} from "./repositories";

// NOTE: 依存方向を明確にするため、ここでは再エクスポートのみを行いロジックは持たない
