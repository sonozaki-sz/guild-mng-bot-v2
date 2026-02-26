// tests/unit/bot/handlers/interactionCreate/ui/index.test.ts
describe("bot/handlers/interactionCreate/ui/index", () => {
  it("exposes ui handler registries", async () => {
    const buttonsModule =
      await import("@/bot/handlers/interactionCreate/ui/buttons");
    const modalsModule =
      await import("@/bot/handlers/interactionCreate/ui/modals");
    const selectMenusModule =
      await import("@/bot/handlers/interactionCreate/ui/selectMenus");

    expect(buttonsModule.buttonHandlers).toBeDefined();
    expect(modalsModule.modalHandlers).toBeDefined();
    expect(selectMenusModule.userSelectHandlers).toBeDefined();
    expect(selectMenusModule.stringSelectHandlers).toBeDefined();
  });
});
