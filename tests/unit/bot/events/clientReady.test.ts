import { Events } from "discord.js";
import { clientReadyEvent } from "../../../../src/bot/events/clientReady";

const handleClientReadyMock = jest.fn();

jest.mock("../../../../src/bot/handlers/clientReadyHandler", () => ({
  handleClientReady: (...args: unknown[]) => handleClientReadyMock(...args),
}));

describe("bot/events/clientReady", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("has expected event metadata", () => {
    expect(clientReadyEvent.name).toBe(Events.ClientReady);
    expect(clientReadyEvent.once).toBe(true);
  });

  it("delegates client to client-ready handler", async () => {
    const client = { user: { tag: "bot#0001" } };

    await clientReadyEvent.execute(client as never);

    expect(handleClientReadyMock).toHaveBeenCalledWith(client);
  });
});
