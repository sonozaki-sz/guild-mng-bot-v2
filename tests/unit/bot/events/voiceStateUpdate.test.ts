import { Events } from "discord.js";
import { voiceStateUpdateEvent } from "@/bot/events/voiceStateUpdate";

const handleVacVoiceStateUpdateMock = jest.fn();

jest.mock("@/bot/features/vac/handlers", () => ({
  handleVacVoiceStateUpdate: (...args: unknown[]) =>
    handleVacVoiceStateUpdateMock(...args),
}));

describe("bot/events/voiceStateUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("has expected event metadata", () => {
    expect(voiceStateUpdateEvent.name).toBe(Events.VoiceStateUpdate);
    expect(voiceStateUpdateEvent.once).toBe(false);
  });

  it("delegates old/new state to VAC voice-state handler", async () => {
    const oldState = { channelId: "old" };
    const newState = { channelId: "new" };

    await voiceStateUpdateEvent.execute(oldState as never, newState as never);

    expect(handleVacVoiceStateUpdateMock).toHaveBeenCalledWith(
      oldState,
      newState,
    );
  });
});
