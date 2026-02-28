// src/bot/services/botCompositionRoot.ts
// Bot層の依存解決を集約する Composition Root

import type { PrismaClient } from "@prisma/client";
import { getGuildConfigRepository } from "../../shared/database/guildConfigRepositoryProvider";
import { createMessageDeleteUserSettingService } from "../../shared/features/message-delete/messageDeleteUserSettingService";
import { createStickyMessageConfigService } from "../../shared/features/sticky-message/stickyMessageConfigService";
import { getVacConfigService } from "../../shared/features/vac/vacConfigService";
import { localeManager } from "../../shared/locale/localeManager";
import { getBumpReminderRepository } from "../features/bump-reminder/repositories/bumpReminderRepository";
import { getBumpReminderFeatureConfigService } from "../features/bump-reminder/services/bumpReminderConfigServiceResolver";
import { getBumpReminderManager } from "../features/bump-reminder/services/bumpReminderService";
import { getMessageDeleteUserSettingRepository } from "../features/message-delete/repositories/messageDeleteUserSettingRepository";
import { getStickyMessageRepository } from "../features/sticky-message/repositories/stickyMessageRepository";
import { getStickyMessageResendService } from "../features/sticky-message/services/stickyMessageResendService";
import {
  createVacRepository,
  getVacRepository,
} from "../features/vac/repositories/vacRepository";
import { getVacService } from "../features/vac/services/vacService";
import {
  setBotBumpReminderConfigService,
  setBotBumpReminderManager,
  setBotBumpReminderRepository,
} from "./botBumpReminderDependencyResolver";
import { setBotGuildConfigRepository } from "./botGuildConfigRepositoryResolver";
import { setBotMessageDeleteUserSettingService } from "./botMessageDeleteDependencyResolver";
import {
  setBotStickyMessageConfigService,
  setBotStickyMessageResendService,
} from "./botStickyMessageDependencyResolver";
import {
  setBotVacRepository,
  setBotVacService,
} from "./botVacDependencyResolver";

/**
 * Botで利用する主要依存を起動時に初期化する
 */
export function initializeBotCompositionRoot(prisma: PrismaClient): void {
  const guildConfigRepository = getGuildConfigRepository(prisma);
  setBotGuildConfigRepository(guildConfigRepository);

  // i18n が guild locale を参照できるよう repository を注入
  localeManager.setRepository(guildConfigRepository);

  // bump-reminder 設定サービス/ジョブ管理の依存を明示注入で解決
  const bumpReminderConfigService = getBumpReminderFeatureConfigService(
    guildConfigRepository,
  );
  const bumpReminderRepository = getBumpReminderRepository(prisma);
  const bumpReminderManager = getBumpReminderManager(bumpReminderRepository);
  setBotBumpReminderConfigService(bumpReminderConfigService);
  setBotBumpReminderRepository(bumpReminderRepository);
  setBotBumpReminderManager(bumpReminderManager);

  // VAC の設定サービス/リポジトリ/サービスを同一 repository で解決
  const vacConfigService = getVacConfigService(guildConfigRepository);
  const vacRepository = createVacRepository(vacConfigService);
  getVacRepository(vacRepository);
  const vacService = getVacService(vacRepository);
  setBotVacRepository(vacRepository);
  setBotVacService(vacService);

  // StickyMessage のリポジトリ/設定サービス/再送信サービスを初期化
  const stickyMessageRepository = getStickyMessageRepository(prisma);
  const stickyMessageConfigService = createStickyMessageConfigService(
    stickyMessageRepository,
  );
  const stickyMessageResendService = getStickyMessageResendService(
    stickyMessageRepository,
  );
  setBotStickyMessageConfigService(stickyMessageConfigService);
  setBotStickyMessageResendService(stickyMessageResendService);

  // message-delete ユーザー設定サービスを初期化
  const messageDeleteUserSettingRepository =
    getMessageDeleteUserSettingRepository(prisma);
  const messageDeleteUserSettingService = createMessageDeleteUserSettingService(
    messageDeleteUserSettingRepository,
  );
  setBotMessageDeleteUserSettingService(messageDeleteUserSettingService);
}
