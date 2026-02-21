import { BUMP_SERVICES } from "@/bot/features/bump-reminder";
import { sendBumpReminder } from "@/bot/features/bump-reminder/handlers/usecases/sendBumpReminder";

const getGuildTranslatorMock = jest.fn();
const tDefaultMock = jest.fn(
  (key: string, _options?: Record<string, unknown>) => key,
);

const loggerInfoMock = jest.fn();
const loggerDebugMock = jest.fn();
const loggerWarnMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  getGuildTranslator: (guildId: string) => getGuildTranslatorMock(guildId),
  tDefault: (key: string, options?: Record<string, unknown>) =>
    tDefaultMock(key, options),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    warn: (...args: unknown[]) => loggerWarnMock(...args),
  },
}));

describe("bot/features/bump-reminder/handlers/usecases/sendBumpReminder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getGuildTranslatorMock.mockResolvedValue((key: string) => key);
  });

  it("warns and returns when channel is not text-based", async () => {
    const client = {
      channels: {
        fetch: jest.fn().mockResolvedValue({ isTextBased: () => false }),
      },
    };
    const configService = { getBumpReminderConfig: jest.fn() };

    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      BUMP_SERVICES.DISBOARD,
      configService as never,
    );

    expect(loggerWarnMock).toHaveBeenCalled();
  });

  it("returns when reminder is disabled", async () => {
    const send = jest.fn();
    const client = {
      channels: {
        fetch: jest.fn().mockResolvedValue({
          isTextBased: () => true,
          isSendable: () => true,
          send,
        }),
      },
    };
    const configService = {
      getBumpReminderConfig: jest.fn().mockResolvedValue({ enabled: false }),
    };

    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      BUMP_SERVICES.DISBOARD,
      configService as never,
    );

    expect(send).not.toHaveBeenCalled();
    expect(loggerDebugMock).toHaveBeenCalled();
  });

  it("sends reply and deletes panel in finally", async () => {
    const panelDelete = jest.fn().mockResolvedValue(undefined);
    const fetchMessage = jest.fn().mockResolvedValue({ delete: panelDelete });
    const channel = {
      isTextBased: () => true,
      isSendable: () => true,
      send: jest.fn().mockResolvedValue(undefined),
      messages: { fetch: fetchMessage },
    };
    const client = {
      channels: {
        fetch: jest.fn().mockResolvedValue(channel),
      },
    };
    const configService = {
      getBumpReminderConfig: jest.fn().mockResolvedValue({
        enabled: true,
        mentionRoleId: "role-1",
        mentionUserIds: ["user-1"],
      }),
    };

    await sendBumpReminder(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      BUMP_SERVICES.DISBOARD,
      configService as never,
      "panel-1",
    );

    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("<@&role-1> <@user-1>"),
        reply: { messageReference: "msg-1" },
      }),
    );
    expect(fetchMessage).toHaveBeenCalledWith("panel-1");
    expect(panelDelete).toHaveBeenCalled();
    expect(loggerInfoMock).toHaveBeenCalled();
  });
});
