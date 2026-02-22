describe("shared/features/bump-reminder/bumpReminderConfigService", () => {
  const CLEAR = "CLEAR";
  const ROLE = "ROLE";
  const ADD = "ADD";
  const REMOVE = "REMOVE";
  const USERS_CLEAR = "USERS_CLEAR";

  const createRepositoryMock = () => ({
    getBumpReminderConfig: vi.fn(),
    updateBumpReminderConfig: vi.fn(),
    setBumpReminderEnabled: vi.fn(),
    setBumpReminderMentionRole: vi.fn(),
    addBumpReminderMentionUser: vi.fn(),
    removeBumpReminderMentionUser: vi.fn(),
    clearBumpReminderMentionUsers: vi.fn(),
    clearBumpReminderMentions: vi.fn(),
  });

  const loadModule = async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const getGuildConfigRepositoryMock = vi.fn();
    vi.doMock("@/shared/database/types", () => ({
      BUMP_REMINDER_MENTION_CLEAR_RESULT: CLEAR,
      BUMP_REMINDER_MENTION_ROLE_RESULT: ROLE,
      BUMP_REMINDER_MENTION_USER_ADD_RESULT: ADD,
      BUMP_REMINDER_MENTION_USER_REMOVE_RESULT: REMOVE,
      BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT: USERS_CLEAR,
    }));
    vi.doMock("@/shared/database/guildConfigRepositoryProvider", () => ({
      getGuildConfigRepository: getGuildConfigRepositoryMock,
    }));

    const module =
      await import("@/shared/features/bump-reminder/bumpReminderConfigService");

    return {
      module,
      getGuildConfigRepositoryMock,
    };
  };

  it("re-exports reminder result constants", async () => {
    const { module } = await loadModule();

    expect(module.BUMP_REMINDER_MENTION_CLEAR_RESULT).toBe(CLEAR);
    expect(module.BUMP_REMINDER_MENTION_ROLE_RESULT).toBe(ROLE);
    expect(module.BUMP_REMINDER_MENTION_USER_ADD_RESULT).toBe(ADD);
    expect(module.BUMP_REMINDER_MENTION_USER_REMOVE_RESULT).toBe(REMOVE);
    expect(module.BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT).toBe(USERS_CLEAR);
  });

  it("returns normalized config and null when repository has no config", async () => {
    const { module } = await loadModule();
    const repository = createRepositoryMock();
    const service = new module.BumpReminderConfigService(repository as never);

    repository.getBumpReminderConfig.mockResolvedValueOnce(null);
    await expect(service.getBumpReminderConfig("guild-1")).resolves.toBeNull();

    const rawConfig = {
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1"],
    };
    repository.getBumpReminderConfig.mockResolvedValueOnce(rawConfig);
    const config = await service.getBumpReminderConfig("guild-1");

    expect(config).toEqual(rawConfig);
    expect(config).not.toBe(rawConfig);
    expect(config?.mentionUserIds).not.toBe(rawConfig.mentionUserIds);
  });

  it("returns fresh default config when repository config is missing", async () => {
    const { module } = await loadModule();
    const repository = createRepositoryMock();
    const service = new module.BumpReminderConfigService(repository as never);
    repository.getBumpReminderConfig.mockResolvedValue(null);

    const first = await service.getBumpReminderConfigOrDefault("guild-1");
    const second = await service.getBumpReminderConfigOrDefault("guild-1");

    expect(first).toEqual(module.DEFAULT_BUMP_REMINDER_CONFIG);
    expect(first.mentionUserIds).toEqual([]);
    expect(first.mentionUserIds).not.toBe(second.mentionUserIds);
  });

  it("returns existing config in getBumpReminderConfigOrDefault when present", async () => {
    const { module } = await loadModule();
    const repository = createRepositoryMock();
    const service = new module.BumpReminderConfigService(repository as never);

    const existing = {
      enabled: true,
      channelId: "channel-x",
      mentionRoleId: "role-x",
      mentionUserIds: ["user-x"],
    };
    repository.getBumpReminderConfig.mockResolvedValueOnce(existing);

    await expect(
      service.getBumpReminderConfigOrDefault("guild-1"),
    ).resolves.toEqual(existing);
  });

  it("normalizes config before save and delegates repository operations", async () => {
    const { module } = await loadModule();
    const repository = createRepositoryMock();
    const service = new module.BumpReminderConfigService(repository as never);

    const input = {
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1"],
    };

    await service.saveBumpReminderConfig("guild-1", input);

    expect(repository.updateBumpReminderConfig).toHaveBeenCalledWith(
      "guild-1",
      expect.objectContaining({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: "role-1",
        mentionUserIds: ["user-1"],
      }),
    );

    const savedConfig = repository.updateBumpReminderConfig.mock
      .calls[0][1] as {
      mentionUserIds: string[];
    };
    expect(savedConfig).not.toBe(input);
    expect(savedConfig.mentionUserIds).not.toBe(input.mentionUserIds);

    repository.setBumpReminderEnabled.mockResolvedValue(undefined);
    await service.setBumpReminderEnabled("guild-1", true, "channel-2");
    expect(repository.setBumpReminderEnabled).toHaveBeenCalledWith(
      "guild-1",
      true,
      "channel-2",
    );

    repository.setBumpReminderMentionRole.mockResolvedValue(ROLE);
    await expect(
      service.setBumpReminderMentionRole("guild-1", "role-2"),
    ).resolves.toBe(ROLE);

    repository.addBumpReminderMentionUser.mockResolvedValue(ADD);
    await expect(
      service.addBumpReminderMentionUser("guild-1", "user-2"),
    ).resolves.toBe(ADD);

    repository.removeBumpReminderMentionUser.mockResolvedValue(REMOVE);
    await expect(
      service.removeBumpReminderMentionUser("guild-1", "user-2"),
    ).resolves.toBe(REMOVE);

    repository.clearBumpReminderMentionUsers.mockResolvedValue(USERS_CLEAR);
    await expect(
      service.clearBumpReminderMentionUsers("guild-1"),
    ).resolves.toBe(USERS_CLEAR);

    repository.clearBumpReminderMentions.mockResolvedValue(CLEAR);
    await expect(service.clearBumpReminderMentions("guild-1")).resolves.toBe(
      CLEAR,
    );
  });

  it("reuses singleton for same repository and recreates for different repository", async () => {
    const { module } = await loadModule();
    const repositoryA = createRepositoryMock();
    const repositoryB = createRepositoryMock();

    const serviceA1 = module.getBumpReminderConfigService(repositoryA as never);
    const serviceA2 = module.getBumpReminderConfigService(repositoryA as never);
    const serviceB = module.getBumpReminderConfigService(repositoryB as never);

    expect(serviceA1).toBe(serviceA2);
    expect(serviceA1).not.toBe(serviceB);
  });

  it("function APIs delegate to singleton service resolved from repository factory", async () => {
    const { module, getGuildConfigRepositoryMock } = await loadModule();
    const repository = createRepositoryMock();
    getGuildConfigRepositoryMock.mockReturnValue(repository);

    repository.getBumpReminderConfig.mockResolvedValue({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1"],
    });
    await module.getBumpReminderConfig("guild-1");
    expect(repository.getBumpReminderConfig).toHaveBeenCalledWith("guild-1");

    repository.getBumpReminderConfig.mockResolvedValueOnce(null);
    await module.getBumpReminderConfigOrDefault("guild-1");

    await module.saveBumpReminderConfig("guild-1", {
      enabled: false,
      mentionUserIds: ["u"],
    });
    expect(repository.updateBumpReminderConfig).toHaveBeenCalledWith(
      "guild-1",
      expect.objectContaining({ enabled: false, mentionUserIds: ["u"] }),
    );

    await module.setBumpReminderEnabled("guild-1", true, "channel-3");
    expect(repository.setBumpReminderEnabled).toHaveBeenCalledWith(
      "guild-1",
      true,
      "channel-3",
    );

    repository.setBumpReminderMentionRole.mockResolvedValue(ROLE);
    await expect(
      module.setBumpReminderMentionRole("guild-1", "role-2"),
    ).resolves.toBe(ROLE);

    repository.addBumpReminderMentionUser.mockResolvedValue(ADD);
    await expect(
      module.addBumpReminderMentionUser("guild-1", "user-2"),
    ).resolves.toBe(ADD);

    repository.removeBumpReminderMentionUser.mockResolvedValue(REMOVE);
    await expect(
      module.removeBumpReminderMentionUser("guild-1", "user-2"),
    ).resolves.toBe(REMOVE);

    repository.clearBumpReminderMentionUsers.mockResolvedValue(USERS_CLEAR);
    await expect(module.clearBumpReminderMentionUsers("guild-1")).resolves.toBe(
      USERS_CLEAR,
    );

    repository.clearBumpReminderMentions.mockResolvedValue(CLEAR);
    await expect(module.clearBumpReminderMentions("guild-1")).resolves.toBe(
      CLEAR,
    );
  });
});
