// tests/unit/bot/features/afk/index.test.ts
describe("bot/features/afk commands", () => {
  it("loads afk feature executors", async () => {
    const afkModule =
      await import("@/bot/features/afk/commands/afkCommand.execute");
    const configModule =
      await import("@/bot/features/afk/commands/afkConfigCommand.execute");

    expect(afkModule.executeAfkCommand).toBeDefined();
    expect(configModule.executeAfkConfigCommand).toBeDefined();
  });
});
