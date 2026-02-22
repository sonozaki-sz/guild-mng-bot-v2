const vacPanelUserSelectHandlerMock = { name: "vac-select" };
const stickyMessageViewSelectHandlerMock = { name: "sticky-view-select" };

vi.mock("@/bot/features/vac/handlers/ui/vacPanelUserSelect", () => ({
  vacPanelUserSelectHandler: vacPanelUserSelectHandlerMock,
}));

vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler",
  () => ({
    stickyMessageViewSelectHandler: stickyMessageViewSelectHandlerMock,
  }),
);

describe("bot/handlers/interactionCreate/ui/selectMenus", () => {
  it("exports user-select handlers", async () => {
    const { userSelectHandlers } =
      await import("@/bot/handlers/interactionCreate/ui/selectMenus");

    expect(userSelectHandlers).toEqual([vacPanelUserSelectHandlerMock]);
  });

  it("exports string-select handlers", async () => {
    const { stringSelectHandlers } =
      await import("@/bot/handlers/interactionCreate/ui/selectMenus");

    expect(stringSelectHandlers).toEqual([stickyMessageViewSelectHandlerMock]);
  });
});
