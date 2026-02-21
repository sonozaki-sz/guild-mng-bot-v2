const getVacConfigServiceMock = jest.fn();

jest.mock("@/shared/features/vac", () => ({
  getVacConfigService: (repository?: unknown) =>
    getVacConfigServiceMock(repository),
}));

function createVacConfigServicePortMock() {
  return {
    getVacConfigOrDefault: jest.fn(),
    saveVacConfig: jest.fn(),
    addTriggerChannel: jest.fn(),
    removeTriggerChannel: jest.fn(),
    addCreatedVacChannel: jest.fn(),
    removeCreatedVacChannel: jest.fn(),
    isManagedVacChannel: jest.fn(),
  };
}

function createRepositoryMock() {
  return {
    getVacConfigOrDefault: jest.fn(),
    saveVacConfig: jest.fn(),
    addTriggerChannel: jest.fn(),
    removeTriggerChannel: jest.fn(),
    addCreatedVacChannel: jest.fn(),
    removeCreatedVacChannel: jest.fn(),
    isManagedVacChannel: jest.fn(),
  };
}

describe("bot/features/vac/repositories/vacRepository", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("delegates all repository operations to injected vac config service", async () => {
    const vacConfigService = createVacConfigServicePortMock();
    const expectedConfig = {
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    };

    vacConfigService.getVacConfigOrDefault.mockResolvedValue(expectedConfig);
    vacConfigService.saveVacConfig.mockResolvedValue(undefined);
    vacConfigService.addTriggerChannel.mockResolvedValue(expectedConfig);
    vacConfigService.removeTriggerChannel.mockResolvedValue(expectedConfig);
    vacConfigService.addCreatedVacChannel.mockResolvedValue(expectedConfig);
    vacConfigService.removeCreatedVacChannel.mockResolvedValue(expectedConfig);
    vacConfigService.isManagedVacChannel.mockResolvedValue(true);

    const { createVacRepository } =
      await import("@/bot/features/vac/repositories/vacRepository");
    const repository = createVacRepository(vacConfigService as never);

    const channelPair = {
      voiceChannelId: "voice-1",
      ownerId: "user-1",
      createdAt: 1,
    };
    await expect(repository.getVacConfigOrDefault("guild-1")).resolves.toBe(
      expectedConfig,
    );
    await expect(
      repository.saveVacConfig("guild-1", expectedConfig),
    ).resolves.toBeUndefined();
    await expect(
      repository.addTriggerChannel("guild-1", "trigger-1"),
    ).resolves.toBe(expectedConfig);
    await expect(
      repository.removeTriggerChannel("guild-1", "trigger-1"),
    ).resolves.toBe(expectedConfig);
    await expect(
      repository.addCreatedVacChannel("guild-1", channelPair),
    ).resolves.toBe(expectedConfig);
    await expect(
      repository.removeCreatedVacChannel("guild-1", "voice-1"),
    ).resolves.toBe(expectedConfig);
    await expect(
      repository.isManagedVacChannel("guild-1", "voice-1"),
    ).resolves.toBe(true);

    expect(vacConfigService.getVacConfigOrDefault).toHaveBeenCalledWith(
      "guild-1",
    );
    expect(vacConfigService.saveVacConfig).toHaveBeenCalledWith(
      "guild-1",
      expectedConfig,
    );
    expect(vacConfigService.addTriggerChannel).toHaveBeenCalledWith(
      "guild-1",
      "trigger-1",
    );
    expect(vacConfigService.removeTriggerChannel).toHaveBeenCalledWith(
      "guild-1",
      "trigger-1",
    );
    expect(vacConfigService.addCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      channelPair,
    );
    expect(vacConfigService.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "voice-1",
    );
    expect(vacConfigService.isManagedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "voice-1",
    );
  });

  it("returns injected repository and reuses it on subsequent no-arg call", async () => {
    const { getVacRepository } =
      await import("@/bot/features/vac/repositories/vacRepository");

    const injectedRepository = createRepositoryMock();
    const resolved = getVacRepository(injectedRepository as never);
    const reused = getVacRepository();

    expect(resolved).toBe(injectedRepository);
    expect(reused).toBe(injectedRepository);
    expect(getVacConfigServiceMock).not.toHaveBeenCalled();
  });

  it("creates default repository once from getVacConfigService", async () => {
    const vacConfigService = createVacConfigServicePortMock();
    getVacConfigServiceMock.mockReturnValue(vacConfigService);

    const { getVacRepository } =
      await import("@/bot/features/vac/repositories/vacRepository");

    const repository1 = getVacRepository();
    const repository2 = getVacRepository();

    expect(repository1).toBe(repository2);
    expect(getVacConfigServiceMock).toHaveBeenCalledTimes(1);
  });

  it("replaces cached default repository when injected repository is provided", async () => {
    const vacConfigService = createVacConfigServicePortMock();
    getVacConfigServiceMock.mockReturnValue(vacConfigService);

    const { getVacRepository } =
      await import("@/bot/features/vac/repositories/vacRepository");

    const defaultRepository = getVacRepository();
    const injectedRepository = createRepositoryMock();
    const replaced = getVacRepository(injectedRepository as never);
    const reusedInjected = getVacRepository();

    expect(replaced).toBe(injectedRepository);
    expect(reusedInjected).toBe(injectedRepository);
    expect(defaultRepository).not.toBe(injectedRepository);
  });
});
