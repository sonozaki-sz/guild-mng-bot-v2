// tests/unit/bot/features/vac/handlers/vacVoiceStateUpdate.test.ts
import { handleVacVoiceStateUpdate } from "@/bot/features/vac/handlers/vacVoiceStateUpdate";

const handleVoiceStateUpdateMock = vi.fn();

vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacService: vi.fn(() => ({
    handleVoiceStateUpdate: (...args: unknown[]) =>
      handleVoiceStateUpdateMock(...args),
  })),
}));

describe("bot/features/vac/handlers/vacVoiceStateUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates voice state pair to vac service", async () => {
    const oldState = { channelId: "old-1" };
    const newState = { channelId: "new-1" };

    await handleVacVoiceStateUpdate(oldState as never, newState as never);

    expect(handleVoiceStateUpdateMock).toHaveBeenCalledWith(oldState, newState);
  });

  it("propagates service failure", async () => {
    handleVoiceStateUpdateMock.mockRejectedValueOnce(
      new Error("service failed"),
    );

    await expect(
      handleVacVoiceStateUpdate({} as never, {} as never),
    ).rejects.toThrow("service failed");
  });
});
