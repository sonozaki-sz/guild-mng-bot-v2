// tests/unit/bot/handlers/interactionCreate/flow/index.test.ts
describe("bot/handlers/interactionCreate/flow modules", () => {
  it("exposes interaction flow handlers", async () => {
    const commandModule =
      await import("@/bot/handlers/interactionCreate/flow/command");
    const componentsModule =
      await import("@/bot/handlers/interactionCreate/flow/components");
    const modalModule =
      await import("@/bot/handlers/interactionCreate/flow/modal");

    expect(commandModule.handleAutocomplete).toBeDefined();
    expect(commandModule.handleChatInputCommand).toBeDefined();
    expect(componentsModule.handleButton).toBeDefined();
    expect(componentsModule.handleUserSelectMenu).toBeDefined();
    expect(modalModule.handleModalSubmit).toBeDefined();
  });
});
