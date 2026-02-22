const vacPanelModalHandlerMock = { name: "vac-modal" };

vi.mock("@/bot/features/vac/handlers/ui/vacPanelModal", () => ({
  vacPanelModalHandler: vacPanelModalHandlerMock,
}));

describe("bot/handlers/interactionCreate/ui/modals", () => {
  it("exports modal handlers", async () => {
    const { modalHandlers } =
      await import("@/bot/handlers/interactionCreate/ui/modals");

    expect(modalHandlers).toEqual([vacPanelModalHandlerMock]);
  });
});
