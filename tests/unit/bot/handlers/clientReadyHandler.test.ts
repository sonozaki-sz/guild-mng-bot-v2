import { handleClientReady } from "@/bot/handlers/clientReadyHandler";
import { ActivityType, PresenceUpdateStatus } from "discord.js";

const tDefaultMock = vi.fn(
  (key: string, params?: Record<string, unknown>) => {
    if (key === "system:bot.presence_activity") {
      return `presence:${String(params?.count)}`;
    }
    return `default:${key}`;
  },
);
const loggerInfoMock = vi.fn();
const restoreBumpRemindersOnStartupMock = vi.fn();
const cleanupVacOnStartupMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string, params?: Record<string, unknown>) =>
    tDefaultMock(key, params),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

vi.mock("@/bot/features/bump-reminder/handlers/bumpReminderStartup", () => ({
  restoreBumpRemindersOnStartup: (...args: unknown[]) =>
    restoreBumpRemindersOnStartupMock(...args),
}));

vi.mock("@/bot/features/vac/handlers/vacStartupCleanup", () => ({
  cleanupVacOnStartup: (...args: unknown[]) => cleanupVacOnStartupMock(...args),
}));

describe("bot/handlers/clientReadyHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    restoreBumpRemindersOnStartupMock.mockResolvedValue(undefined);
    cleanupVacOnStartupMock.mockResolvedValue(undefined);
  });

  it("logs startup metrics, updates presence, and runs startup tasks", async () => {
    const setPresenceMock = vi.fn();
    const client = {
      user: { tag: "bot#0001", setPresence: setPresenceMock },
      guilds: { cache: { size: 3 } },
      users: { cache: { size: 10 } },
      commands: { size: 5 },
    };

    await handleClientReady(client as never);

    expect(loggerInfoMock).toHaveBeenCalledTimes(4);
    expect(setPresenceMock).toHaveBeenCalledWith({
      activities: [
        {
          name: "presence:3",
          type: ActivityType.Playing,
        },
      ],
      status: PresenceUpdateStatus.Online,
    });
    expect(restoreBumpRemindersOnStartupMock).toHaveBeenCalledWith(client);
    expect(cleanupVacOnStartupMock).toHaveBeenCalledWith(client);
  });

  it("propagates startup task failure", async () => {
    restoreBumpRemindersOnStartupMock.mockRejectedValueOnce(
      new Error("restore failed"),
    );
    const client = {
      user: { tag: "bot#0001", setPresence: vi.fn() },
      guilds: { cache: { size: 1 } },
      users: { cache: { size: 1 } },
      commands: { size: 1 },
    };

    await expect(handleClientReady(client as never)).rejects.toThrow(
      "restore failed",
    );
    expect(cleanupVacOnStartupMock).not.toHaveBeenCalled();
  });
});
