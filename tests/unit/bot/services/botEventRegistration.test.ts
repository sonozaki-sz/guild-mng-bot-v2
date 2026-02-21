import { registerBotEvents } from "@/bot/services/botEventRegistration";

const loggerInfoMock = jest.fn();
const loggerDebugMock = jest.fn();
const registerBotEventMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tDefault: jest.fn((key: string) => `default:${key}`),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    debug: (...args: unknown[]) => loggerDebugMock(...args),
  },
}));

jest.mock("@/bot/types/discord", () => ({
  registerBotEvent: (...args: unknown[]) => registerBotEventMock(...args),
}));

describe("bot/services/botEventRegistration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers all events and logs progress", () => {
    const client = {};
    const events = [
      { name: "ready", execute: jest.fn() },
      { name: "interactionCreate", execute: jest.fn() },
    ];

    registerBotEvents(client as never, events as never);

    expect(registerBotEventMock).toHaveBeenCalledTimes(2);
    expect(registerBotEventMock).toHaveBeenNthCalledWith(1, client, events[0]);
    expect(registerBotEventMock).toHaveBeenNthCalledWith(2, client, events[1]);
    expect(loggerInfoMock).toHaveBeenCalledTimes(2);
    expect(loggerDebugMock).toHaveBeenCalledTimes(2);
  });
});
