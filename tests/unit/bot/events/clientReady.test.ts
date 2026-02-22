import { Events } from "discord.js";
import { clientReadyEvent } from "@/bot/events/clientReady";

const handleClientReadyMock = vi.fn();

vi.mock("@/bot/handlers/clientReadyHandler", () => ({
  handleClientReady: (...args: unknown[]) => handleClientReadyMock(...args),
}));

describe("bot/events/clientReady", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
