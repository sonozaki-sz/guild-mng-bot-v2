import { handleBumpMessageCreate } from "@/bot/features/bump-reminder/handlers/bumpMessageCreateHandler";

const resolveBumpServiceMock = jest.fn();
const handleBumpDetectedMock = jest.fn();

jest.mock("@/shared/config", () => ({
  NODE_ENV: { PRODUCTION: "production" },
  env: {
    NODE_ENV: "test",
    TEST_MODE: true,
  },
}));

jest.mock("@/bot/features/bump-reminder", () => ({
  BUMP_COMMANDS: {
    DISBOARD: "/bump",
    DISSOKU: "/dissoku up",
  },
  BUMP_SERVICES: {
    DISBOARD: "disboard",
    DISSOKU: "dissoku",
  },
  resolveBumpService: (...args: unknown[]) => resolveBumpServiceMock(...args),
}));

jest.mock("@/bot/features/bump-reminder/handlers/bumpReminderHandler", () => ({
  handleBumpDetected: (...args: unknown[]) => handleBumpDetectedMock(...args),
}));

function createMessage(overrides?: Partial<Record<string, unknown>>) {
  return {
    guild: { id: "guild-1" },
    channel: { id: "channel-1" },
    id: "msg-1",
    client: { id: "client" },
    content: "",
    author: { id: "bot-1", bot: true },
    interaction: null,
    ...overrides,
  };
}

describe("bot/features/bump-reminder/handlers/bumpMessageCreateHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ignores messages without guild", async () => {
    const message = createMessage({ guild: null });

    await handleBumpMessageCreate(message as never);

    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
  });

  it("detects test disboard command in test mode", async () => {
    const message = createMessage({
      author: { id: "user-1", bot: false },
      content: "test /bump",
    });

    await handleBumpMessageCreate(message as never);

    expect(handleBumpDetectedMock).toHaveBeenCalledWith(
      message.client,
      "guild-1",
      "channel-1",
      "msg-1",
      "disboard",
    );
  });

  it("detects production bot interaction message via resolver", async () => {
    resolveBumpServiceMock.mockReturnValueOnce("dissoku");
    const message = createMessage({
      interaction: { commandName: "dissoku" },
    });

    await handleBumpMessageCreate(message as never);

    expect(resolveBumpServiceMock).toHaveBeenCalledWith("bot-1", "dissoku");
    expect(handleBumpDetectedMock).toHaveBeenCalledWith(
      message.client,
      "guild-1",
      "channel-1",
      "msg-1",
      "dissoku",
    );
  });
});
