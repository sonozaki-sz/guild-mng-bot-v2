import { handleClientReady } from "@/bot/handlers/clientReadyHandler";
import { ActivityType, PresenceUpdateStatus } from "discord.js";

const tDefaultMock = jest.fn(
  (key: string, params?: Record<string, unknown>) => {
    if (key === "system:bot.presence_activity") {
      return `presence:${String(params?.count)}`;
    }
    return `default:${key}`;
  },
);
const loggerInfoMock = jest.fn();
const restoreBumpRemindersOnStartupMock = jest.fn();
const cleanupVacOnStartupMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tDefault: (key: string, params?: Record<string, unknown>) =>
    tDefaultMock(key, params),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

jest.mock("@/bot/features/bump-reminder/handlers", () => ({
  restoreBumpRemindersOnStartup: (...args: unknown[]) =>
    restoreBumpRemindersOnStartupMock(...args),
}));

jest.mock("@/bot/features/vac/handlers", () => ({
  cleanupVacOnStartup: (...args: unknown[]) => cleanupVacOnStartupMock(...args),
}));

describe("bot/handlers/clientReadyHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreBumpRemindersOnStartupMock.mockResolvedValue(undefined);
    cleanupVacOnStartupMock.mockResolvedValue(undefined);
  });

  it("logs startup metrics, updates presence, and runs startup tasks", async () => {
    const setPresenceMock = jest.fn();
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
      user: { tag: "bot#0001", setPresence: jest.fn() },
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
