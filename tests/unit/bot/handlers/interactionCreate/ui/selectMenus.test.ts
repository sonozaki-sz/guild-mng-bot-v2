const vacPanelUserSelectHandlerMock = { name: "vac-select" };

vi.mock("@/bot/features/vac/handlers/ui/vacPanelUserSelect", () => ({
  vacPanelUserSelectHandler: vacPanelUserSelectHandlerMock,
}));

describe("bot/handlers/interactionCreate/ui/selectMenus", () => {
  it("exports user-select handlers", async () => {
    const { userSelectHandlers } =
      await import("@/bot/handlers/interactionCreate/ui/selectMenus");

    expect(userSelectHandlers).toEqual([vacPanelUserSelectHandlerMock]);
  });
});
