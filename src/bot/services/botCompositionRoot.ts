// src/bot/services/botCompositionRoot.ts
// Bot層の依存解決を集約する Composition Root

import type { PrismaClient } from "@prisma/client";
import { getGuildConfigRepository } from "../../shared/database";
import { getVacConfigService } from "../../shared/features/vac";
import { localeManager } from "../../shared/locale";
import {
  getBumpReminderFeatureConfigService,
  getBumpReminderManager,
  getBumpReminderRepository,
} from "../features/bump-reminder";
import { createVacRepository, getVacRepository } from "../features/vac";
import { getVacService } from "../features/vac/services";
import {
  setBotBumpReminderConfigService,
  setBotBumpReminderManager,
  setBotBumpReminderRepository,
} from "./botBumpReminderDependencyResolver";
import { setBotGuildConfigRepository } from "./botGuildConfigRepositoryResolver";
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
}
