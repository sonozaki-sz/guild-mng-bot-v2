import { messageCreateEvent } from "../../../../src/bot/events/messageCreate";

const envState = {
  NODE_ENV: "development",
  TEST_MODE: false,
};

const handleBumpDetectedMock = jest.fn();
const resolveBumpServiceMock = jest.fn();

// 環境依存分岐を安定的に検証するため、env を可変モック化する
jest.mock("../../../../src/shared/config/env", () => ({
  NODE_ENV: {
    PRODUCTION: "production",
  },
  env: {
    get NODE_ENV() {
      return envState.NODE_ENV;
    },
    get TEST_MODE() {
      return envState.TEST_MODE;
    },
  },
}));

// Bump 検知処理は呼び出し引数の検証に集中するため置き換える
jest.mock("../../../../src/bot/features/bump-reminder", () => ({
  BUMP_COMMANDS: {
    DISBOARD: "bump",
    DISSOKU: "up",
  },
  BUMP_SERVICES: {
    DISBOARD: "Disboard",
    DISSOKU: "Dissoku",
  },
  resolveBumpService: (...args: unknown[]) => resolveBumpServiceMock(...args),
}));

jest.mock(
  "../../../../src/bot/features/bump-reminder/bumpReminderHandler",
  () => ({
    handleBumpDetected: (...args: unknown[]) => handleBumpDetectedMock(...args),
  }),
);

type MessageLike = {
  guild: { id: string } | null;
  channel: { id: string };
  id: string;
  content: string;
  author: { id: string; bot: boolean };
  interaction?: { commandName?: string };
  client: { tag: string };
};

// messageCreate イベント検証用の最小メッセージモック
function createMessage(overrides?: Partial<MessageLike>): MessageLike {
  return {
    guild: { id: "guild-1" },
    channel: { id: "channel-1" },
    id: "message-1",
    content: "",
    author: { id: "author-1", bot: true },
    interaction: { commandName: "bump" },
    client: { tag: "bot-client" },
    ...overrides,
  };
}

describe("bot/events/messageCreate", () => {
  // 各ケースで環境とモック呼び出し状態を初期化する
  beforeEach(() => {
    jest.clearAllMocks();
    envState.NODE_ENV = "development";
    envState.TEST_MODE = false;
  });

  // DM は対象外として早期 return することを検証
  it("ignores DM messages", async () => {
    const message = createMessage({ guild: null });

    await messageCreateEvent.execute(message as never);

    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
  });

  // テストモードでは test bump で検知できることを検証
  it("detects test bump command in non-production test mode", async () => {
    envState.NODE_ENV = "development";
    envState.TEST_MODE = true;

    const message = createMessage({
      content: "test bump",
      author: { id: "user-1", bot: false },
      interaction: undefined,
    });

    await messageCreateEvent.execute(message as never);

    expect(handleBumpDetectedMock).toHaveBeenCalledWith(
      message.client,
      "guild-1",
      "channel-1",
      "message-1",
      "Disboard",
    );
  });

  // テストモードでは test up で Dissoku を検知できることを検証
  it("detects test up command in non-production test mode", async () => {
    envState.NODE_ENV = "development";
    envState.TEST_MODE = true;

    const message = createMessage({
      content: "TEST up",
      author: { id: "user-1", bot: false },
      interaction: undefined,
    });

    await messageCreateEvent.execute(message as never);

    expect(handleBumpDetectedMock).toHaveBeenCalledWith(
      message.client,
      "guild-1",
      "channel-1",
      "message-1",
      "Dissoku",
    );
  });

  // テストモードでも test bump/up 以外は検知せず通常分岐へ流れることを検証
  it("does not detect non-test command content in test mode", async () => {
    envState.NODE_ENV = "development";
    envState.TEST_MODE = true;

    const message = createMessage({
      content: "test other",
      author: { id: "user-1", bot: false },
      interaction: undefined,
    });

    await messageCreateEvent.execute(message as never);

    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
    expect(resolveBumpServiceMock).not.toHaveBeenCalled();
  });

  // Bot以外の通常メッセージは本番処理では無視されることを検証
  it("ignores non-bot messages outside test-mode detection", async () => {
    const message = createMessage({ author: { id: "user-1", bot: false } });

    await messageCreateEvent.execute(message as never);

    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
  });

  // 対応サービス判定が取れた場合のみ Bump 処理を呼ぶことを検証
  it("handles bot slash-command message when service is resolved", async () => {
    resolveBumpServiceMock.mockReturnValue("Disboard");
    const message = createMessage({
      author: { id: "302050872383242240", bot: true },
      interaction: { commandName: "bump" },
    });

    await messageCreateEvent.execute(message as never);

    expect(resolveBumpServiceMock).toHaveBeenCalledWith(
      "302050872383242240",
      "bump",
    );
    expect(handleBumpDetectedMock).toHaveBeenCalledWith(
      message.client,
      "guild-1",
      "channel-1",
      "message-1",
      "Disboard",
    );
  });

  // interaction.commandName が無い場合は検知しないことを検証
  it("ignores bot message when commandName is missing", async () => {
    const message = createMessage({
      interaction: undefined,
      author: { id: "302050872383242240", bot: true },
    });

    await messageCreateEvent.execute(message as never);

    expect(resolveBumpServiceMock).not.toHaveBeenCalled();
    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
  });

  // サービス解決できない場合は検知しないことを検証
  it("ignores bot slash-command message when service cannot be resolved", async () => {
    resolveBumpServiceMock.mockReturnValue(undefined);
    const message = createMessage({
      author: { id: "unknown-bot", bot: true },
      interaction: { commandName: "unknown" },
    });

    await messageCreateEvent.execute(message as never);

    expect(resolveBumpServiceMock).toHaveBeenCalledWith(
      "unknown-bot",
      "unknown",
    );
    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
  });
});
