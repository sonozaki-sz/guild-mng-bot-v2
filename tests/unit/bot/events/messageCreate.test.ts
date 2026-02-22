import { messageCreateEvent } from "@/bot/events/messageCreate";
import { Events } from "discord.js";

const handleBumpMessageCreateMock = vi.fn();

vi.mock("@/bot/features/bump-reminder/handlers/bumpMessageCreateHandler", () => ({
  handleBumpMessageCreate: (...args: unknown[]) =>
    handleBumpMessageCreateMock(...args),
}));

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
});
