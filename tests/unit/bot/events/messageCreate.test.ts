// tests/unit/bot/events/messageCreate.test.ts
import { messageCreateEvent } from "@/bot/events/messageCreate";
import { Events } from "discord.js";

const handleBumpMessageCreateMock = vi.fn();
const handleStickyMessageCreateMock = vi.fn();

vi.mock(
  "@/bot/features/bump-reminder/handlers/bumpMessageCreateHandler",
  () => ({
    handleBumpMessageCreate: (...args: unknown[]) =>
      handleBumpMessageCreateMock(...args),
  }),
);

vi.mock(
  "@/bot/features/sticky-message/handlers/stickyMessageCreateHandler",
  () => ({
    handleStickyMessageCreate: (...args: unknown[]) =>
      handleStickyMessageCreateMock(...args),
  }),
);

describe("bot/events/messageCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has expected event metadata", () => {
    expect(messageCreateEvent.name).toBe(Events.MessageCreate);
    expect(messageCreateEvent.once).toBe(false);
  });

  it("delegates message to bump message handler", async () => {
    const message = { content: "bump" };

    await messageCreateEvent.execute(message as never);

    expect(handleBumpMessageCreateMock).toHaveBeenCalledWith(message);
  });

  it("delegates message to sticky message handler", async () => {
    const message = { content: "hello" };

    await messageCreateEvent.execute(message as never);

    expect(handleStickyMessageCreateMock).toHaveBeenCalledWith(message);
  });
});
