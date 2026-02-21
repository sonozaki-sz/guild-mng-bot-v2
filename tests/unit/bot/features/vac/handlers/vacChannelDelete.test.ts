import { handleVacChannelDelete } from "@/bot/features/vac/handlers/vacChannelDelete";

const handleChannelDeleteMock = vi.fn();

vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacService: vi.fn(() => ({
    handleChannelDelete: (...args: unknown[]) =>
      handleChannelDeleteMock(...args),
  })),
}));

describe("bot/features/vac/handlers/vacChannelDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates deleted channel to vac service", async () => {
    const channel = { id: "voice-1" };

    await handleVacChannelDelete(channel as never);

    expect(handleChannelDeleteMock).toHaveBeenCalledWith(channel);
  });

  it("propagates service failure", async () => {
    handleChannelDeleteMock.mockRejectedValueOnce(new Error("service failed"));

    await expect(handleVacChannelDelete({} as never)).rejects.toThrow(
      "service failed",
    );
  });
});
