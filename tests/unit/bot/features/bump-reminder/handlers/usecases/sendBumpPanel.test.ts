// tests/unit/bot/features/bump-reminder/handlers/usecases/sendBumpPanel.test.ts
describe("bot/features/bump-reminder/handlers/usecases/sendBumpPanel", () => {
  it("exports sendBumpPanel function", async () => {
    const module =
      await import("@/bot/features/bump-reminder/handlers/usecases/sendBumpPanel");

    expect(typeof module.sendBumpPanel).toBe("function");
  });
});
