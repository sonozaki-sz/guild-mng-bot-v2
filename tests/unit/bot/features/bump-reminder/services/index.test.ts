// tests/unit/bot/features/bump-reminder/services/index.test.ts
describe("bot/features/bump-reminder/services/index", () => {
  it("exposes config resolver and manager", async () => {
    const resolverModule =
      await import("@/bot/features/bump-reminder/services/bumpReminderConfigServiceResolver");
    const managerModule =
      await import("@/bot/features/bump-reminder/services/bumpReminderService");

    expect(resolverModule.createBumpReminderFeatureConfigService).toBeDefined();
    expect(resolverModule.getBumpReminderFeatureConfigService).toBeDefined();
    expect(managerModule.BumpReminderManager).toBeDefined();
    expect(managerModule.createBumpReminderManager).toBeDefined();
    expect(managerModule.getBumpReminderManager).toBeDefined();
  });
});
