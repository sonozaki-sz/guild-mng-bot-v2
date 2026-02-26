// tests/unit/bot/features/bump-reminder/index.test.ts
describe("bot/features/bump-reminder/index", () => {
  it("exposes core symbols from concrete modules", async () => {
    const constantsModule =
      await import("@/bot/features/bump-reminder/constants/bumpReminderConstants");
    const servicesModule =
      await import("@/bot/features/bump-reminder/services/bumpReminderService");
    const repositoriesModule =
      await import("@/bot/features/bump-reminder/repositories/bumpReminderRepository");

    expect(constantsModule.BUMP_SERVICES).toBeDefined();
    expect(servicesModule.getBumpReminderManager).toBeDefined();
    expect(repositoriesModule.getBumpReminderRepository).toBeDefined();
  });
});
