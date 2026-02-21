const bumpPanelButtonHandlerMock = { name: "bump" };
const vacPanelButtonHandlerMock = { name: "vac" };

jest.mock("@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler", () => ({
  bumpPanelButtonHandler: bumpPanelButtonHandlerMock,
}));

jest.mock("@/bot/features/vac/handlers/ui/vacPanelButton", () => ({
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
