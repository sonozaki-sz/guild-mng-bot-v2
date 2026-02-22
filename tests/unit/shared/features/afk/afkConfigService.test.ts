describe("shared/features/afk/afkConfigService", () => {
  const createRepositoryMock = () => ({
    getAfkConfig: vi.fn(),
    setAfkChannel: vi.fn(),
    updateAfkConfig: vi.fn(),
  });

  const loadModule = async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const getGuildConfigRepositoryMock = vi.fn();
    vi.doMock("@/shared/database/guildConfigRepositoryProvider", () => ({
      getGuildConfigRepository: getGuildConfigRepositoryMock,
    }));

    const module = await import("@/shared/features/afk/afkConfigService");

    return {
      module,
      getGuildConfigRepositoryMock,
    };
  };

  it("returns null and normalized config from getAfkConfig", async () => {
    const { module } = await loadModule();
    const repository = createRepositoryMock();
    const service = new module.AfkConfigService(repository as never);

    repository.getAfkConfig.mockResolvedValueOnce(null);
    await expect(service.getAfkConfig("guild-1")).resolves.toBeNull();

    const rawConfig = { enabled: true, channelId: "channel-1" };
    repository.getAfkConfig.mockResolvedValueOnce(rawConfig);
    const config = await service.getAfkConfig("guild-1");

    expect(config).toEqual(rawConfig);
    expect(config).not.toBe(rawConfig);
  });

  it("returns fresh default config when repository has no config", async () => {
    const { module } = await loadModule();
    const repository = createRepositoryMock();
    const service = new module.AfkConfigService(repository as never);
    repository.getAfkConfig.mockResolvedValue(null);

    const first = await service.getAfkConfigOrDefault("guild-1");
    const second = await service.getAfkConfigOrDefault("guild-1");

    expect(first).toEqual(module.DEFAULT_AFK_CONFIG);
    expect(first).not.toBe(second);
  });

  it("returns existing config in getAfkConfigOrDefault when present", async () => {
    const { module } = await loadModule();
    const repository = createRepositoryMock();
    const service = new module.AfkConfigService(repository as never);

    const existing = { enabled: true, channelId: "channel-x" };
    repository.getAfkConfig.mockResolvedValueOnce(existing);

    await expect(service.getAfkConfigOrDefault("guild-1")).resolves.toEqual(
      existing,
    );
  });

  it("normalizes config before save and delegates repository operations", async () => {
    const { module } = await loadModule();
    const repository = createRepositoryMock();
    const service = new module.AfkConfigService(repository as never);

    const input = { enabled: true, channelId: "channel-1" };

    await service.saveAfkConfig("guild-1", input);

    expect(repository.updateAfkConfig).toHaveBeenCalledWith(
      "guild-1",
      expect.objectContaining({ enabled: true, channelId: "channel-1" }),
    );

    const savedConfig = repository.updateAfkConfig.mock.calls[0][1] as {
      enabled: boolean;
      channelId?: string;
    };
    expect(savedConfig).not.toBe(input);

    repository.setAfkChannel.mockResolvedValue(undefined);
    await service.setAfkChannel("guild-1", "channel-2");
    expect(repository.setAfkChannel).toHaveBeenCalledWith(
      "guild-1",
      "channel-2",
    );
  });

  it("reuses singleton for same repository and recreates for different repository", async () => {
    const { module } = await loadModule();
    const repositoryA = createRepositoryMock();
    const repositoryB = createRepositoryMock();

    const serviceA1 = module.getAfkConfigService(repositoryA as never);
    const serviceA2 = module.getAfkConfigService(repositoryA as never);
    const serviceB = module.getAfkConfigService(repositoryB as never);

    expect(serviceA1).toBe(serviceA2);
    expect(serviceA1).not.toBe(serviceB);
  });

  it("function APIs delegate to singleton service resolved from repository factory", async () => {
    const { module, getGuildConfigRepositoryMock } = await loadModule();
    const repository = createRepositoryMock();
    getGuildConfigRepositoryMock.mockReturnValue(repository);

    repository.getAfkConfig.mockResolvedValue({
      enabled: true,
      channelId: "channel-1",
    });
    await module.getAfkConfig("guild-1");
    expect(repository.getAfkConfig).toHaveBeenCalledWith("guild-1");

    repository.getAfkConfig.mockResolvedValueOnce(null);
    await module.getAfkConfigOrDefault("guild-1");

    await module.saveAfkConfig("guild-1", { enabled: false });
    expect(repository.updateAfkConfig).toHaveBeenCalledWith(
      "guild-1",
      expect.objectContaining({ enabled: false }),
    );

    await module.setAfkChannel("guild-1", "channel-3");
    expect(repository.setAfkChannel).toHaveBeenCalledWith(
      "guild-1",
      "channel-3",
    );
  });
});
