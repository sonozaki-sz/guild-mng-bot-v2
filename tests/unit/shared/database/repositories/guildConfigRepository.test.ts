describe("shared/database/repositories/guildConfigRepository", () => {
  const loadModule = async () => {
    jest.resetModules();

    const coreUsecases = {
      getGuildConfigUsecase: jest.fn(),
      saveGuildConfigUsecase: jest.fn(),
      updateGuildConfigUsecase: jest.fn(),
      deleteGuildConfigUsecase: jest.fn(),
      existsGuildConfigUsecase: jest.fn(),
      getGuildLocaleUsecase: jest.fn(),
      updateGuildLocaleUsecase: jest.fn(),
    };

    const afkStore = {
      getAfkConfig: jest.fn(),
      setAfkChannel: jest.fn(),
      updateAfkConfig: jest.fn(),
    };
    const bumpStore = {
      getBumpReminderConfig: jest.fn(),
      setBumpReminderEnabled: jest.fn(),
      updateBumpReminderConfig: jest.fn(),
      setBumpReminderMentionRole: jest.fn(),
      addBumpReminderMentionUser: jest.fn(),
      removeBumpReminderMentionUser: jest.fn(),
      clearBumpReminderMentionUsers: jest.fn(),
      clearBumpReminderMentions: jest.fn(),
    };
    const vacStore = {
      getVacConfig: jest.fn(),
      updateVacConfig: jest.fn(),
    };
    const stickStore = {
      getStickMessages: jest.fn(),
      updateStickMessages: jest.fn(),
    };
    const memberStore = {
      getMemberLogConfig: jest.fn(),
      updateMemberLogConfig: jest.fn(),
    };

    const GuildAfkConfigStore = jest.fn(() => afkStore);
    const GuildBumpReminderConfigStore = jest.fn(() => bumpStore);
    const GuildVacConfigStore = jest.fn(() => vacStore);
    const GuildStickMessageStore = jest.fn(() => stickStore);
    const GuildMemberLogConfigStore = jest.fn(() => memberStore);

    jest.doMock(
      "@/shared/database/repositories/usecases/guildConfigCoreUsecases",
      () => coreUsecases,
    );
    jest.doMock("@/shared/database/stores/guildAfkConfigStore", () => ({
      GuildAfkConfigStore,
    }));
    jest.doMock(
      "@/shared/database/stores/guildBumpReminderConfigStore",
      () => ({ GuildBumpReminderConfigStore }),
    );
    jest.doMock("@/shared/database/stores/guildVacConfigStore", () => ({
      GuildVacConfigStore,
    }));
    jest.doMock("@/shared/database/stores/guildStickMessageStore", () => ({
      GuildStickMessageStore,
    }));
    jest.doMock("@/shared/database/stores/guildMemberLogConfigStore", () => ({
      GuildMemberLogConfigStore,
    }));

    const module =
      await import("@/shared/database/repositories/guildConfigRepository");
    return {
      module,
      coreUsecases,
      afkStore,
      bumpStore,
      vacStore,
      stickStore,
      memberStore,
      constructors: {
        GuildAfkConfigStore,
        GuildBumpReminderConfigStore,
        GuildVacConfigStore,
        GuildStickMessageStore,
        GuildMemberLogConfigStore,
      },
    };
  };

  it("delegates core operations to core usecases with deps", async () => {
    const { module, coreUsecases } = await loadModule();
    const prisma = { guildConfig: {} };
    const repository = new module.PrismaGuildConfigRepository(prisma as never);

    coreUsecases.getGuildConfigUsecase.mockResolvedValue({ guildId: "g1" });
    coreUsecases.existsGuildConfigUsecase.mockResolvedValue(true);
    coreUsecases.getGuildLocaleUsecase.mockResolvedValue("ja");

    await expect(repository.getConfig("g1")).resolves.toEqual({
      guildId: "g1",
    });
    await repository.saveConfig({ guildId: "g1" } as never);
    await repository.updateConfig("g1", { locale: "en" } as never);
    await repository.deleteConfig("g1");
    await expect(repository.exists("g1")).resolves.toBe(true);
    await expect(repository.getLocale("g1")).resolves.toBe("ja");
    await repository.updateLocale("g1", "en");

    expect(coreUsecases.getGuildConfigUsecase).toHaveBeenCalledWith(
      expect.objectContaining({
        prisma,
        defaultLocale: "ja",
        toDatabaseError: expect.any(Function),
      }),
      "g1",
    );
    expect(coreUsecases.saveGuildConfigUsecase).toHaveBeenCalled();
    expect(coreUsecases.updateGuildConfigUsecase).toHaveBeenCalled();
    expect(coreUsecases.deleteGuildConfigUsecase).toHaveBeenCalled();
    expect(coreUsecases.existsGuildConfigUsecase).toHaveBeenCalled();
    expect(coreUsecases.getGuildLocaleUsecase).toHaveBeenCalled();
    expect(coreUsecases.updateGuildLocaleUsecase).toHaveBeenCalled();
  });

  it("converts unknown errors to DatabaseError via toDatabaseError helper", async () => {
    const { module, coreUsecases } = await loadModule();
    const prisma = { guildConfig: {} };
    const repository = new module.PrismaGuildConfigRepository(prisma as never);

    coreUsecases.getGuildConfigUsecase.mockImplementation(
      (deps: {
        toDatabaseError: (prefix: string, error: unknown) => Error;
      }) => {
        throw deps.toDatabaseError("read failed", "non-error");
      },
    );

    await expect(repository.getConfig("g1")).rejects.toMatchObject({
      name: "DatabaseError",
      message: "read failed: unknown error",
    });
  });

  it("delegates feature-specific operations to each store", async () => {
    const {
      module,
      afkStore,
      bumpStore,
      vacStore,
      stickStore,
      memberStore,
      constructors,
    } = await loadModule();
    const prisma = { guildConfig: {} };
    const repository = new module.PrismaGuildConfigRepository(prisma as never);

    afkStore.getAfkConfig.mockResolvedValue({ enabled: true });
    bumpStore.getBumpReminderConfig.mockResolvedValue({ enabled: false });
    bumpStore.setBumpReminderMentionRole.mockResolvedValue("updated");
    bumpStore.addBumpReminderMentionUser.mockResolvedValue("added");
    bumpStore.removeBumpReminderMentionUser.mockResolvedValue("removed");
    bumpStore.clearBumpReminderMentionUsers.mockResolvedValue("cleared");
    bumpStore.clearBumpReminderMentions.mockResolvedValue("cleared");
    vacStore.getVacConfig.mockResolvedValue({ enabled: true });
    stickStore.getStickMessages.mockResolvedValue([]);
    memberStore.getMemberLogConfig.mockResolvedValue({ channelId: "x" });

    await repository.getAfkConfig("g1");
    await repository.setAfkChannel("g1", "ch1");
    await repository.updateAfkConfig("g1", { enabled: true } as never);

    await repository.getBumpReminderConfig("g1");
    await repository.setBumpReminderEnabled("g1", true, "ch2");
    await repository.updateBumpReminderConfig("g1", { enabled: true } as never);
    await repository.setBumpReminderMentionRole("g1", "r1");
    await repository.addBumpReminderMentionUser("g1", "u1");
    await repository.removeBumpReminderMentionUser("g1", "u1");
    await repository.clearBumpReminderMentionUsers("g1");
    await repository.clearBumpReminderMentions("g1");

    await repository.getVacConfig("g1");
    await repository.updateVacConfig("g1", { enabled: true } as never);
    await repository.getStickMessages("g1");
    await repository.updateStickMessages("g1", []);
    await repository.getMemberLogConfig("g1");
    await repository.updateMemberLogConfig("g1", { channelId: "x" });

    expect(constructors.GuildAfkConfigStore).toHaveBeenCalledTimes(1);
    expect(constructors.GuildBumpReminderConfigStore).toHaveBeenCalledTimes(1);
    expect(constructors.GuildVacConfigStore).toHaveBeenCalledTimes(1);
    expect(constructors.GuildStickMessageStore).toHaveBeenCalledTimes(1);
    expect(constructors.GuildMemberLogConfigStore).toHaveBeenCalledTimes(1);

    expect(afkStore.getAfkConfig).toHaveBeenCalledWith("g1");
    expect(afkStore.setAfkChannel).toHaveBeenCalledWith("g1", "ch1");
    expect(afkStore.updateAfkConfig).toHaveBeenCalledWith("g1", {
      enabled: true,
    });
    expect(bumpStore.getBumpReminderConfig).toHaveBeenCalledWith("g1");
    expect(vacStore.getVacConfig).toHaveBeenCalledWith("g1");
    expect(stickStore.getStickMessages).toHaveBeenCalledWith("g1");
    expect(memberStore.getMemberLogConfig).toHaveBeenCalledWith("g1");
  });

  it("createGuildConfigRepository returns repository instance", async () => {
    const { module } = await loadModule();
    const prisma = { guildConfig: {} };

    const repository = module.createGuildConfigRepository(prisma as never);
    expect(repository).toBeInstanceOf(module.PrismaGuildConfigRepository);
  });
});
