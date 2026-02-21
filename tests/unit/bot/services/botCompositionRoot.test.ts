import { initializeBotCompositionRoot } from "@/bot/services/botCompositionRoot";

const getGuildConfigRepositoryMock = jest.fn();
const getVacConfigServiceMock = jest.fn();
const getBumpReminderFeatureConfigServiceMock = jest.fn();
const getBumpReminderRepositoryMock = jest.fn();
const getBumpReminderManagerMock = jest.fn();
const createVacRepositoryMock = jest.fn();
const getVacRepositoryMock = jest.fn();
const getVacServiceMock = jest.fn();

const setBotGuildConfigRepositoryMock = jest.fn();
const setBotBumpReminderConfigServiceMock = jest.fn();
const setBotBumpReminderRepositoryMock = jest.fn();
const setBotBumpReminderManagerMock = jest.fn();
const setBotVacRepositoryMock = jest.fn();
const setBotVacServiceMock = jest.fn();
const localeSetRepositoryMock = jest.fn();

jest.mock("@/shared/database", () => ({
  getGuildConfigRepository: (...args: unknown[]) =>
    getGuildConfigRepositoryMock(...args),
}));

jest.mock("@/shared/features/vac", () => ({
  getVacConfigService: (...args: unknown[]) => getVacConfigServiceMock(...args),
}));

jest.mock("@/shared/locale", () => ({
  localeManager: {
    setRepository: (...args: unknown[]) => localeSetRepositoryMock(...args),
  },
}));

jest.mock("@/bot/features/bump-reminder", () => ({
  getBumpReminderFeatureConfigService: (...args: unknown[]) =>
    getBumpReminderFeatureConfigServiceMock(...args),
  getBumpReminderRepository: (...args: unknown[]) =>
    getBumpReminderRepositoryMock(...args),
  getBumpReminderManager: (...args: unknown[]) =>
    getBumpReminderManagerMock(...args),
}));

jest.mock("@/bot/features/vac", () => ({
  createVacRepository: (...args: unknown[]) => createVacRepositoryMock(...args),
  getVacRepository: (...args: unknown[]) => getVacRepositoryMock(...args),
}));

jest.mock("@/bot/features/vac/services", () => ({
  getVacService: (...args: unknown[]) => getVacServiceMock(...args),
}));

jest.mock("@/bot/services/botGuildConfigRepositoryResolver", () => ({
  setBotGuildConfigRepository: (...args: unknown[]) =>
    setBotGuildConfigRepositoryMock(...args),
}));

jest.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  setBotBumpReminderConfigService: (...args: unknown[]) =>
    setBotBumpReminderConfigServiceMock(...args),
  setBotBumpReminderRepository: (...args: unknown[]) =>
    setBotBumpReminderRepositoryMock(...args),
  setBotBumpReminderManager: (...args: unknown[]) =>
    setBotBumpReminderManagerMock(...args),
}));

jest.mock("@/bot/services/botVacDependencyResolver", () => ({
  setBotVacRepository: (...args: unknown[]) => setBotVacRepositoryMock(...args),
  setBotVacService: (...args: unknown[]) => setBotVacServiceMock(...args),
}));

describe("bot/services/botCompositionRoot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
