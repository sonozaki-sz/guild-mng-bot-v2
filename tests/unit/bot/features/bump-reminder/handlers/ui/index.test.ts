// tests/unit/bot/features/bump-reminder/handlers/ui/index.test.ts
describe("bot/features/bump-reminder/handlers/ui/index", () => {
  it("exposes bump panel button handler", async () => {
    const handlerModule =
      await import("@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler");

    expect(handlerModule.bumpPanelButtonHandler).toBeDefined();
  });
});
