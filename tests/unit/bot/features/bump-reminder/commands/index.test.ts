// tests/unit/bot/features/bump-reminder/commands/index.test.ts
describe("bot/features/bump-reminder/commands/index", () => {
  it("exposes command definitions", async () => {
    const constantsModule =
      await import("@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.constants");
    const executeModule =
      await import("@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.execute");

    expect(constantsModule.BUMP_REMINDER_CONFIG_COMMAND).toBeDefined();
    expect(executeModule.executeBumpReminderConfigCommand).toBeDefined();
  });
});
