// tests/unit/bot/features/ping/index.test.ts
describe("bot/features/ping command module", () => {
  it("exposes ping feature executor", async () => {
    const commandModule =
      await import("@/bot/features/ping/commands/pingCommand.execute");

    expect(commandModule.executePingCommand).toBeDefined();
  });
});
