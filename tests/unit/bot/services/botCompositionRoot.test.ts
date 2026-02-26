// tests/unit/bot/services/botCompositionRoot.test.ts
import { initializeBotCompositionRoot } from "@/bot/services/botCompositionRoot";

const getGuildConfigRepositoryMock = vi.fn();
const getVacConfigServiceMock = vi.fn();
const getBumpReminderFeatureConfigServiceMock = vi.fn();
const getBumpReminderRepositoryMock = vi.fn();
const getBumpReminderManagerMock = vi.fn();
const createVacRepositoryMock = vi.fn();
const getVacRepositoryMock = vi.fn();
const getVacServiceMock = vi.fn();

const setBotGuildConfigRepositoryMock = vi.fn();
const setBotBumpReminderConfigServiceMock = vi.fn();
const setBotBumpReminderRepositoryMock = vi.fn();
const setBotBumpReminderManagerMock = vi.fn();
const setBotVacRepositoryMock = vi.fn();
const setBotVacServiceMock = vi.fn();
const localeSetRepositoryMock = vi.fn();

vi.mock("@/shared/database/guildConfigRepositoryProvider", () => ({
  getGuildConfigRepository: (...args: unknown[]) =>
    getGuildConfigRepositoryMock(...args),
}));

vi.mock("@/shared/features/vac/vacConfigService", () => ({
  getVacConfigService: (...args: unknown[]) => getVacConfigServiceMock(...args),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  localeManager: {
    setRepository: (...args: unknown[]) => localeSetRepositoryMock(...args),
  },
}));

vi.mock("@/bot/features/bump-reminder/services/bumpReminderConfigServiceResolver", () => ({
  getBumpReminderFeatureConfigService: (...args: unknown[]) =>
    getBumpReminderFeatureConfigServiceMock(...args),
}));

vi.mock("@/bot/features/bump-reminder/repositories/bumpReminderRepository", () => ({
  getBumpReminderRepository: (...args: unknown[]) =>
    getBumpReminderRepositoryMock(...args),
}));

vi.mock("@/bot/features/bump-reminder/services/bumpReminderService", () => ({
  getBumpReminderManager: (...args: unknown[]) =>
    getBumpReminderManagerMock(...args),
}));

vi.mock("@/bot/features/vac/repositories/vacRepository", () => ({
  createVacRepository: (...args: unknown[]) => createVacRepositoryMock(...args),
  getVacRepository: (...args: unknown[]) => getVacRepositoryMock(...args),
}));

vi.mock("@/bot/features/vac/services/vacService", () => ({
  getVacService: (...args: unknown[]) => getVacServiceMock(...args),
}));

vi.mock("@/bot/services/botGuildConfigRepositoryResolver", () => ({
  setBotGuildConfigRepository: (...args: unknown[]) =>
    setBotGuildConfigRepositoryMock(...args),
}));

vi.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  setBotBumpReminderConfigService: (...args: unknown[]) =>
    setBotBumpReminderConfigServiceMock(...args),
  setBotBumpReminderRepository: (...args: unknown[]) =>
    setBotBumpReminderRepositoryMock(...args),
  setBotBumpReminderManager: (...args: unknown[]) =>
    setBotBumpReminderManagerMock(...args),
}));

vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  setBotVacRepository: (...args: unknown[]) => setBotVacRepositoryMock(...args),
  setBotVacService: (...args: unknown[]) => setBotVacServiceMock(...args),
}));

// Prismaインスタンスを起点として全ボット依存関係が正しく構築・各セッターへ注入されるDIの正確さを検証する
describe("bot/services/botCompositionRoot", () => {
  // 前テストのモック呼び出し記録が次テストに混入しないようリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 各ファクトリの戻り値が対応するセッターへ漏れなく渡されるか、全依存を一括で確認
  it("wires all bot dependencies from prisma root", () => {
    const prisma = { id: "prisma" };
    const guildConfigRepository = { id: "guild-config-repo" };
    const bumpConfigService = { id: "bump-config-service" };
    const bumpRepository = { id: "bump-repo" };
    const bumpManager = { id: "bump-manager" };
    const vacConfigService = { id: "vac-config-service" };
    const vacRepository = { id: "vac-repo" };
    const vacService = { id: "vac-service" };

    getGuildConfigRepositoryMock.mockReturnValue(guildConfigRepository);
    getBumpReminderFeatureConfigServiceMock.mockReturnValue(bumpConfigService);
    getBumpReminderRepositoryMock.mockReturnValue(bumpRepository);
    getBumpReminderManagerMock.mockReturnValue(bumpManager);
    getVacConfigServiceMock.mockReturnValue(vacConfigService);
    createVacRepositoryMock.mockReturnValue(vacRepository);
    getVacServiceMock.mockReturnValue(vacService);

    initializeBotCompositionRoot(prisma as never);

    expect(setBotGuildConfigRepositoryMock).toHaveBeenCalledWith(
      guildConfigRepository,
    );
    expect(localeSetRepositoryMock).toHaveBeenCalledWith(guildConfigRepository);
    expect(setBotBumpReminderConfigServiceMock).toHaveBeenCalledWith(
      bumpConfigService,
    );
    expect(setBotBumpReminderRepositoryMock).toHaveBeenCalledWith(
      bumpRepository,
    );
    expect(setBotBumpReminderManagerMock).toHaveBeenCalledWith(bumpManager);
    expect(getVacRepositoryMock).toHaveBeenCalledWith(vacRepository);
    expect(setBotVacRepositoryMock).toHaveBeenCalledWith(vacRepository);
    expect(setBotVacServiceMock).toHaveBeenCalledWith(vacService);
  });
});
