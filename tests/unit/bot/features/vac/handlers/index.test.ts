// tests/unit/bot/features/vac/handlers/index.test.ts
describe("bot/features/vac/handlers/index", () => {
  it("exposes vac handlers", async () => {
    const uiPanel =
      await import("@/bot/features/vac/handlers/ui/vacControlPanel");
    const uiButton =
      await import("@/bot/features/vac/handlers/ui/vacPanelButton");
    const uiModal =
      await import("@/bot/features/vac/handlers/ui/vacPanelModal");
    const uiUserSelect =
      await import("@/bot/features/vac/handlers/ui/vacPanelUserSelect");
    const channelDelete =
      await import("@/bot/features/vac/handlers/vacChannelDelete");
    const startup =
      await import("@/bot/features/vac/handlers/vacStartupCleanup");
    const voiceState =
      await import("@/bot/features/vac/handlers/vacVoiceStateUpdate");

    expect(uiPanel.VAC_PANEL_CUSTOM_ID).toBeDefined();
    expect(uiPanel.getVacPanelChannelId).toBeDefined();
    expect(uiPanel.sendVacControlPanel).toBeDefined();
    expect(uiButton.vacPanelButtonHandler).toBeDefined();
    expect(uiModal.vacPanelModalHandler).toBeDefined();
    expect(uiUserSelect.vacPanelUserSelectHandler).toBeDefined();
    expect(channelDelete.handleVacChannelDelete).toBeDefined();
    expect(startup.cleanupVacOnStartup).toBeDefined();
    expect(voiceState.handleVacVoiceStateUpdate).toBeDefined();
  });
});
