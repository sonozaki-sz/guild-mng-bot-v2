describe("bot/services/botGuildConfigRepositoryResolver", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("stores and returns guild config repository", async () => {
    const module =
      await import("@/bot/services/botGuildConfigRepositoryResolver");
    const repository = { id: "guild-config-repo" } as never;

    module.setBotGuildConfigRepository(repository);

    expect(module.getBotGuildConfigRepository()).toBe(repository);
  });

  it("throws when repository is not initialized", async () => {
    const module =
      await import("@/bot/services/botGuildConfigRepositoryResolver");

    expect(() => module.getBotGuildConfigRepository()).toThrow(
      "GuildConfigRepository is not initialized",
    );
  });
});
