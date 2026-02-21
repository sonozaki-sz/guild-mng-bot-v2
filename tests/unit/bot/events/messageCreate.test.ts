import { Events } from "discord.js";
import { messageCreateEvent } from "../../../../src/bot/events/messageCreate";

const handleBumpMessageCreateMock = jest.fn();

jest.mock("../../../../src/bot/features/bump-reminder/handlers", () => ({
  handleBumpMessageCreate: (...args: unknown[]) =>
    handleBumpMessageCreateMock(...args),
}));

describe("bot/events/messageCreate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
