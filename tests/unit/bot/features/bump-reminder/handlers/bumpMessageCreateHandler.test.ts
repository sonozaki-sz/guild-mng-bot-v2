// tests/unit/bot/features/bump-reminder/handlers/bumpMessageCreateHandler.test.ts
import { handleBumpMessageCreate } from "@/bot/features/bump-reminder/handlers/bumpMessageCreateHandler";

const resolveBumpServiceMock = vi.fn();
const handleBumpDetectedMock = vi.fn();

vi.mock("@/shared/config/env", () => ({
  NODE_ENV: { PRODUCTION: "production" },
  env: {
    NODE_ENV: "test",
    TEST_MODE: true,
  },
}));

vi.mock("@/bot/features/bump-reminder/constants/bumpReminderConstants", () => ({
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

vi.mock("@/bot/features/bump-reminder/handlers/bumpReminderHandler", () => ({
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

// バンプメッセージ受信ハンドラーのメッセージ振り分けロジックを検証する
// guild なし・テストモードのコマンド検出・本番ボットのインタラクション経由検出・各種ガード条件のスキップを網羅する
describe("bot/features/bump-reminder/handlers/bumpMessageCreateHandler", () => {
  // テスト間でモックの呼び出し状態をリセットし干渉を防ぐ
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores messages without guild", async () => {
    const message = createMessage({ guild: null });

    await handleBumpMessageCreate(message as never);

    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
  });

  // テストモードで "test /bump" プレフィックスを含むメッセージが Disboard バンプとして検出されることを検証
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

  it("detects test dissoku command in test mode", async () => {
    const message = createMessage({
      author: { id: "user-1", bot: false },
      content: "test /dissoku up",
    });

    await handleBumpMessageCreate(message as never);

    expect(handleBumpDetectedMock).toHaveBeenCalledWith(
      message.client,
      "guild-1",
      "channel-1",
      "msg-1",
      "dissoku",
    );
  });

  // テストコマンドプレフィックスを持たない一般ユーザーメッセージがすべてのガードを通過せず無視されることを検証
  it("ignores non-bot normal messages outside test command flow", async () => {
    const message = createMessage({
      author: { id: "user-1", bot: false },
      content: "hello",
    });

    await handleBumpMessageCreate(message as never);

    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
    expect(resolveBumpServiceMock).not.toHaveBeenCalled();
  });

  it("ignores bot message without interaction commandName", async () => {
    const message = createMessage({ interaction: null });

    await handleBumpMessageCreate(message as never);

    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
    expect(resolveBumpServiceMock).not.toHaveBeenCalled();
  });

  it("ignores when resolver cannot map service", async () => {
    resolveBumpServiceMock.mockReturnValueOnce(undefined);
    const message = createMessage({ interaction: { commandName: "unknown" } });

    await handleBumpMessageCreate(message as never);

    expect(resolveBumpServiceMock).toHaveBeenCalledWith("bot-1", "unknown");
    expect(handleBumpDetectedMock).not.toHaveBeenCalled();
  });

  // 本番環境でボットがinteraction付きメッセージを送信した場合にリゾルバーでサービスを解決し検出されることを検証
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
