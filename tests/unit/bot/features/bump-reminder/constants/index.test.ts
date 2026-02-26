// tests/unit/bot/features/bump-reminder/constants/index.test.ts
describe("bot/features/bump-reminder/constants/index", () => {
  it("exposes core constants and helpers", async () => {
    const rawModule =
      await import("@/bot/features/bump-reminder/constants/bumpReminderConstants");

    expect(rawModule.BUMP_CONSTANTS).toBeDefined();
    expect(rawModule.BUMP_SERVICES).toBeDefined();
    expect(rawModule.resolveBumpService).toBeDefined();
    expect(rawModule.toBumpReminderJobId).toBeDefined();
  });
});
