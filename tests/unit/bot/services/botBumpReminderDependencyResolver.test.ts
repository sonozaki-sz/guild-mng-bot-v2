// tests/unit/bot/services/botBumpReminderDependencyResolver.test.ts
describe("bot/services/botBumpReminderDependencyResolver", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("stores and returns bump reminder dependencies", async () => {
    const module =
      await import("@/bot/services/botBumpReminderDependencyResolver");

    const configService = { id: "config" } as never;
    const repository = { id: "repo" } as never;
    const manager = { id: "manager" } as never;

    module.setBotBumpReminderConfigService(configService);
    module.setBotBumpReminderRepository(repository);
    module.setBotBumpReminderManager(manager);

    expect(module.getBotBumpReminderConfigService()).toBe(configService);
    expect(module.getBotBumpReminderRepository()).toBe(repository);
    expect(module.getBotBumpReminderManager()).toBe(manager);
  });

  it("throws when dependencies are not initialized", async () => {
    const module =
      await import("@/bot/services/botBumpReminderDependencyResolver");

    expect(() => module.getBotBumpReminderConfigService()).toThrow(
      "BumpReminderConfigService is not initialized",
    );
    expect(() => module.getBotBumpReminderRepository()).toThrow(
      "BumpReminderRepository is not initialized",
    );
    expect(() => module.getBotBumpReminderManager()).toThrow(
      "BumpReminderManager is not initialized",
    );
  });
});
