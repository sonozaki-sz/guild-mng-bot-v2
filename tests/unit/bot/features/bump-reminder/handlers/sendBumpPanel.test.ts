import { sendBumpPanel } from "@/bot/features/bump-reminder/handlers/usecases/sendBumpPanel";

const toScheduledAtMock = jest.fn();
const getGuildTranslatorMock = jest.fn();
const tDefaultMock = jest.fn(
  (key: string, _options?: Record<string, unknown>) => key,
);
const createInfoEmbedMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.mock("@/bot/features/bump-reminder", () => ({
  BUMP_CONSTANTS: {
    CUSTOM_ID_PREFIX: {
      MENTION_ON: "on:",
      MENTION_OFF: "off:",
    },
  },
  toScheduledAt: (...args: unknown[]) => toScheduledAtMock(...args),
}));

jest.mock("@/shared/locale", () => ({
  getGuildTranslator: (guildId: string) => getGuildTranslatorMock(guildId),
  tDefault: (key: string, options?: Record<string, unknown>) =>
    tDefaultMock(key, options),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: (...args: unknown[]) => createInfoEmbedMock(...args),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

describe("bot/features/bump-reminder/handlers/usecases/sendBumpPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    toScheduledAtMock.mockReturnValue(new Date("2026-02-21T00:00:00.000Z"));
    getGuildTranslatorMock.mockResolvedValue(
      (key: string) =>
        ({
          "events:bump-reminder.panel.scheduled_at": "scheduled",
          "events:bump-reminder.panel.title": "title",
          "events:bump-reminder.panel.button_mention_on": "on",
          "events:bump-reminder.panel.button_mention_off": "off",
        })[key] ?? key,
    );
    createInfoEmbedMock.mockReturnValue({
      title: "title",
      description: "scheduled",
    });
  });

  it("returns undefined when target channel is not text-based", async () => {
    const client = {
      channels: {
        fetch: jest.fn().mockResolvedValue({ isTextBased: () => false }),
      },
    };

    const result = await sendBumpPanel(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      120,
    );

    expect(result).toBeUndefined();
  });

  it("sends panel and returns message id", async () => {
    const send = jest.fn().mockResolvedValue({ id: "panel-1" });
    const client = {
      channels: {
        fetch: jest.fn().mockResolvedValue({
          isTextBased: () => true,
          isSendable: () => true,
          send,
        }),
      },
    };

    const result = await sendBumpPanel(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      120,
    );

    expect(result).toBe("panel-1");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        components: expect.any(Array),
        reply: { messageReference: "msg-1" },
      }),
    );
  });

  it("logs and returns undefined when fetch fails", async () => {
    const error = new Error("fetch failed");
    const client = {
      channels: {
        fetch: jest.fn().mockRejectedValue(error),
      },
    };

    const result = await sendBumpPanel(
      client as never,
      "guild-1",
      "ch-1",
      "msg-1",
      120,
    );

    expect(result).toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
