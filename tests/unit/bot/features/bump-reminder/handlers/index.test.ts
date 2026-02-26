// tests/unit/bot/features/bump-reminder/handlers/index.test.ts
describe("bot/features/bump-reminder/handlers/index", () => {
  it("exposes handler functions", async () => {
    const messageCreateModule =
      await import("@/bot/features/bump-reminder/handlers/bumpMessageCreateHandler");
    const reminderModule =
      await import("@/bot/features/bump-reminder/handlers/bumpReminderHandler");
    const startupModule =
      await import("@/bot/features/bump-reminder/handlers/bumpReminderStartup");
    const uiModule =
      await import("@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler");

    expect(messageCreateModule.handleBumpMessageCreate).toBeDefined();
    expect(reminderModule.handleBumpDetected).toBeDefined();
    expect(reminderModule.sendBumpPanel).toBeDefined();
    expect(reminderModule.sendBumpReminder).toBeDefined();
    expect(startupModule.restoreBumpRemindersOnStartup).toBeDefined();
    expect(uiModule.bumpPanelButtonHandler).toBeDefined();
  });
});
