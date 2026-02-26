// tests/unit/bot/handlers/interactionCreate/ui/buttons.test.ts
const bumpPanelButtonHandlerMock = { name: "bump" };
const vacPanelButtonHandlerMock = { name: "vac" };

vi.mock("@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler", () => ({
  bumpPanelButtonHandler: bumpPanelButtonHandlerMock,
}));

vi.mock("@/bot/features/vac/handlers/ui/vacPanelButton", () => ({
  vacPanelButtonHandler: vacPanelButtonHandlerMock,
}));

describe("bot/handlers/interactionCreate/ui/buttons", () => {
  it("exports button handlers in expected order", async () => {
    const { buttonHandlers } =
      await import("@/bot/handlers/interactionCreate/ui/buttons");

    expect(buttonHandlers).toEqual([
      bumpPanelButtonHandlerMock,
      vacPanelButtonHandlerMock,
    ]);
  });
});
