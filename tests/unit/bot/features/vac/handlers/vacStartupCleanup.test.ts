import { cleanupVacOnStartup } from "@/bot/features/vac/handlers/vacStartupCleanup";

const cleanupOnStartupMock = jest.fn();

jest.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacService: jest.fn(() => ({
    cleanupOnStartup: (...args: unknown[]) => cleanupOnStartupMock(...args),
  })),
}));

describe("bot/features/vac/handlers/vacStartupCleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates startup client to vac service", async () => {
    const client = { guilds: { cache: new Map() } };

    await cleanupVacOnStartup(client as never);

    expect(cleanupOnStartupMock).toHaveBeenCalledWith(client);
  });

  it("propagates service failure", async () => {
    cleanupOnStartupMock.mockRejectedValueOnce(new Error("service failed"));

    await expect(cleanupVacOnStartup({} as never)).rejects.toThrow(
      "service failed",
    );
  });
});
