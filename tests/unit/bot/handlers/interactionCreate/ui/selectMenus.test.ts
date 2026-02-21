const vacPanelUserSelectHandlerMock = { name: "vac-select" };

jest.mock("@/bot/features/vac/handlers/ui", () => ({
  vacPanelUserSelectHandler: vacPanelUserSelectHandlerMock,
}));

describe("bot/handlers/interactionCreate/ui/selectMenus", () => {
  it("exports user-select handlers", async () => {
    const { userSelectHandlers } =
      await import("@/bot/handlers/interactionCreate/ui/selectMenus");

    expect(userSelectHandlers).toEqual([vacPanelUserSelectHandlerMock]);
  });
});
