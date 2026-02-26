// tests/unit/bot/features/bump-reminder/repositories/index.test.ts
describe("bot/features/bump-reminder/repositories/index", () => {
  it("exposes repository constructors", async () => {
    const repoModule =
      await import("@/bot/features/bump-reminder/repositories/bumpReminderRepository");

    expect(repoModule.BumpReminderRepository).toBeDefined();
    expect(repoModule.createBumpReminderRepository).toBeDefined();
    expect(repoModule.getBumpReminderRepository).toBeDefined();
  });
});
