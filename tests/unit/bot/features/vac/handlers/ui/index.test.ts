// tests/unit/bot/features/vac/handlers/ui/index.test.ts
describe("bot/features/vac/handlers/ui/index", () => {
  it("exposes vac ui handlers", async () => {
    const panel =
      await import("@/bot/features/vac/handlers/ui/vacControlPanel");
    const button =
      await import("@/bot/features/vac/handlers/ui/vacPanelButton");
    const modal = await import("@/bot/features/vac/handlers/ui/vacPanelModal");
    const userSelect =
      await import("@/bot/features/vac/handlers/ui/vacPanelUserSelect");

    expect(panel.VAC_PANEL_CUSTOM_ID).toBeDefined();
    expect(panel.getVacPanelChannelId).toBeDefined();
    expect(panel.sendVacControlPanel).toBeDefined();
    expect(button.vacPanelButtonHandler).toBeDefined();
    expect(modal.vacPanelModalHandler).toBeDefined();
    expect(userSelect.vacPanelUserSelectHandler).toBeDefined();
  });
});
