const vacPanelModalHandlerMock = { name: "vac-modal" };
const stickyMessageSetModalHandlerMock = { name: "sticky-message-set-modal" };
const stickyMessageSetEmbedModalHandlerMock = {
  name: "sticky-message-set-embed-modal",
};
const stickyMessageUpdateModalHandlerMock = {
  name: "sticky-message-update-modal",
};
const stickyMessageUpdateEmbedModalHandlerMock = {
  name: "sticky-message-update-embed-modal",
};

vi.mock("@/bot/features/vac/handlers/ui/vacPanelModal", () => ({
  vacPanelModalHandler: vacPanelModalHandlerMock,
}));
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler",
  () => ({
    stickyMessageSetModalHandler: stickyMessageSetModalHandlerMock,
  }),
);
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler",
  () => ({
    stickyMessageSetEmbedModalHandler: stickyMessageSetEmbedModalHandlerMock,
  }),
);
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler",
  () => ({
    stickyMessageUpdateModalHandler: stickyMessageUpdateModalHandlerMock,
  }),
);
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler",
  () => ({
    stickyMessageUpdateEmbedModalHandler:
      stickyMessageUpdateEmbedModalHandlerMock,
  }),
);

describe("bot/handlers/interactionCreate/ui/modals", () => {
  it("exports modal handlers", async () => {
    const { modalHandlers } =
      await import("@/bot/handlers/interactionCreate/ui/modals");

    expect(modalHandlers).toEqual([
      vacPanelModalHandlerMock,
      stickyMessageSetModalHandlerMock,
      stickyMessageSetEmbedModalHandlerMock,
      stickyMessageUpdateModalHandlerMock,
      stickyMessageUpdateEmbedModalHandlerMock,
    ]);
  });
});
