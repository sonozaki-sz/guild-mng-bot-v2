// tests/unit/bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder.test.ts
describe("bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder", () => {
  it("exports scheduleBumpReminder function", async () => {
    const module =
      await import("@/bot/features/bump-reminder/handlers/usecases/scheduleBumpReminder");

    expect(typeof module.scheduleBumpReminder).toBe("function");
  });
});
