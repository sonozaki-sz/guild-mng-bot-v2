// tests/unit/bot/events/voiceStateUpdate.test.ts
import { voiceStateUpdateEvent } from "@/bot/events/voiceStateUpdate";
import { Events } from "discord.js";

const handleVacVoiceStateUpdateMock = vi.fn();

vi.mock("@/bot/features/vac/handlers/vacVoiceStateUpdate", () => ({
  handleVacVoiceStateUpdate: (...args: unknown[]) =>
    handleVacVoiceStateUpdateMock(...args),
}));

describe("bot/events/voiceStateUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
