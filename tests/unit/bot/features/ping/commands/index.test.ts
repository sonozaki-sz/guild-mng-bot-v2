// tests/unit/bot/features/ping/commands/index.test.ts
describe("bot/features/ping/commands module", () => {
  it("exposes executePingCommand", async () => {
    const commandModule =
      await import("@/bot/features/ping/commands/pingCommand.execute");

    expect(commandModule.executePingCommand).toBeDefined();
  });
});
