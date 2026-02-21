import { handleInteractionError } from "../../../src/bot/errors/interactionErrorHandler";
import { interactionCreateEvent } from "../../../src/bot/events/interactionCreate";

// エラーハンドラは呼び出し確認だけ行う
jest.mock("../../../src/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: jest.fn(),
  handleInteractionError: jest.fn(),
}));

// ローカライズとロガーは副作用を排除する
jest.mock("../../../src/shared/locale", () => ({
  tDefault: jest.fn((key: string) => key),
  tGuild: jest.fn(async (_guildId: string, key: string) => key),
}));
jest.mock("../../../src/shared/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Handler レジストリをテスト専用に差し替え、ルーティングを直接検証できるようにする
jest.mock("../../../src/bot/handlers/interactionCreate/ui/modals", () => {
  const modalHandler = {
    matches: jest.fn((customId: string) => customId.startsWith("modal:")),
    execute: jest.fn().mockResolvedValue(undefined),
  };
  return {
    modalHandlers: [modalHandler],
    __modalHandler: modalHandler,
  };
});
jest.mock("../../../src/bot/handlers/interactionCreate/ui/buttons", () => {
  const buttonHandler = {
    matches: jest.fn((customId: string) => customId.startsWith("btn:")),
    execute: jest.fn().mockResolvedValue(undefined),
  };
  return {
    buttonHandlers: [buttonHandler],
    __buttonHandler: buttonHandler,
  };
});
jest.mock("../../../src/bot/handlers/interactionCreate/ui/selectMenus", () => {
  const userSelectHandler = {
    matches: jest.fn((customId: string) => customId.startsWith("select:")),
    execute: jest.fn().mockResolvedValue(undefined),
  };
  return {
    userSelectHandlers: [userSelectHandler],
    __userSelectHandler: userSelectHandler,
  };
});

type InteractionBase = {
  client: {
    commands: Map<string, unknown>;
    cooldownManager: { check: jest.Mock };
    modals: Map<string, { execute: jest.Mock<Promise<void>, [unknown]> }>;
  };
  customId: string;
  user: { id: string; tag: string };
  reply: jest.Mock<Promise<void>, [unknown]>;
  commandName: string;
  guildId: string;
  isChatInputCommand: jest.Mock<boolean, []>;
  isAutocomplete: jest.Mock<boolean, []>;
  isModalSubmit: jest.Mock<boolean, []>;
  isButton: jest.Mock<boolean, []>;
  isUserSelectMenu: jest.Mock<boolean, []>;
};

// interactionCreate の各分岐に使う共通 interaction モック
function createInteraction(
  overrides?: Partial<InteractionBase>,
): InteractionBase {
  return {
    client: {
      commands: new Map(),
      cooldownManager: { check: jest.fn(() => 0) },
      modals: new Map(),
    },
    customId: "id-1",
    user: { id: "user-1", tag: "user#0001" },
    reply: jest.fn().mockResolvedValue(undefined),
    commandName: "ping",
    guildId: "guild-1",
    isChatInputCommand: jest.fn(() => false),
    isAutocomplete: jest.fn(() => false),
    isModalSubmit: jest.fn(() => false),
    isButton: jest.fn(() => false),
    isUserSelectMenu: jest.fn(() => false),
    ...overrides,
  };
}

describe("integration: interactionCreate handler routing", () => {
  // ケース間でモック状態をリセットし、呼び出し回数の検証を安定させる
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // modal submit は modalHandlers へルーティングされることを確認する
  it("routes modal submit to modal handler registry", async () => {
    const modalModule = jest.requireMock(
      "../../../src/bot/handlers/interactionCreate/ui/modals",
    ) as {
      __modalHandler: {
        execute: jest.Mock<Promise<void>, [unknown]>;
      };
    };

    const interaction = createInteraction({
      customId: "modal:rename:1",
      isModalSubmit: jest.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(modalModule.__modalHandler.execute).toHaveBeenCalledWith(
      interaction,
    );
  });

  // button interaction は buttonHandlers を経由して処理されることを確認する
  it("routes button interaction to button handler registry", async () => {
    const buttonModule = jest.requireMock(
      "../../../src/bot/handlers/interactionCreate/ui/buttons",
    ) as {
      __buttonHandler: {
        execute: jest.Mock<Promise<void>, [unknown]>;
      };
    };

    const interaction = createInteraction({
      customId: "btn:panel:1",
      isButton: jest.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(buttonModule.__buttonHandler.execute).toHaveBeenCalledWith(
      interaction,
    );
  });

  // user select の例外は interaction 用エラーハンドラへ委譲されることを確認する
  it("delegates user-select handler failure to interaction error handler", async () => {
    const selectModule = jest.requireMock(
      "../../../src/bot/handlers/interactionCreate/ui/selectMenus",
    ) as {
      __userSelectHandler: {
        execute: jest.Mock<Promise<void>, [unknown]>;
      };
    };
    const error = new Error("select failed");
    selectModule.__userSelectHandler.execute.mockRejectedValueOnce(error);

    const interaction = createInteraction({
      customId: "select:afk:1",
      isUserSelectMenu: jest.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(interaction, error);
  });
});
