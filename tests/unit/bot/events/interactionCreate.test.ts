import type { Mock } from "vitest";
import {
  handleCommandError,
  handleInteractionError,
} from "@/bot/errors/interactionErrorHandler";
import { interactionCreateEvent } from "@/bot/events/interactionCreate";
import { tGuild } from "@/shared/locale/localeManager";
import { logger } from "@/shared/utils/logger";
import { Events, MessageFlags } from "discord.js";

// ErrorHandler は呼び出し有無の検証に限定する
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
  handleInteractionError: vi.fn(),
}));

// ローカライズは固定文字列化してアサーションを簡潔にする
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
  tGuild: vi.fn(async (_guildId: string, key: string) => `guild:${key}`),
}));

// ログ出力は副作用回避のためダミー化する
vi.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// レジストリハンドラはテストごとに挙動を制御できるようダミーを公開する
vi.mock("@/bot/handlers/interactionCreate/ui/buttons", () => {
  const mockButtonHandler = {
    matches: vi.fn(() => false),
    execute: vi.fn().mockResolvedValue(undefined),
  };
  return {
    buttonHandlers: [mockButtonHandler],
    __mockButtonHandler: mockButtonHandler,
  };
});
vi.mock("@/bot/handlers/interactionCreate/ui/modals", () => {
  const mockModalHandler = {
    matches: vi.fn(() => false),
    execute: vi.fn().mockResolvedValue(undefined),
  };
  return {
    modalHandlers: [mockModalHandler],
    __mockModalHandler: mockModalHandler,
  };
});
vi.mock("@/bot/handlers/interactionCreate/ui/selectMenus", () => {
  const mockUserSelectHandler = {
    matches: vi.fn(() => false),
    execute: vi.fn().mockResolvedValue(undefined),
  };
  return {
    userSelectHandlers: [mockUserSelectHandler],
    __mockUserSelectHandler: mockUserSelectHandler,
  };
});

type BaseInteraction = {
  client: {
    commands: Map<string, unknown>;
    cooldownManager: { check: Mock };
    modals: Map<string, { execute: Mock<(arg: unknown) => Promise<void>> }>;
  };
  commandName: string;
  customId: string;
  guildId: string;
  user: { id: string; tag: string };
  reply: Mock<(arg: unknown) => Promise<void>>;
  isChatInputCommand: Mock<() => boolean>;
  isAutocomplete: Mock<() => boolean>;
  isModalSubmit: Mock<() => boolean>;
  isButton: Mock<() => boolean>;
  isUserSelectMenu: Mock<() => boolean>;
};

// interactionCreate 用の最小 interaction を共通化して分岐設定を容易にする
function createInteraction(
  overrides?: Partial<BaseInteraction>,
): BaseInteraction {
  return {
    client: {
      commands: new Map(),
      cooldownManager: { check: vi.fn(() => 0) },
      modals: new Map(),
    },
    commandName: "ping",
    customId: "custom-id",
    guildId: "guild-1",
    user: { id: "user-1", tag: "user#0001" },
    reply: vi.fn().mockResolvedValue(undefined),
    isChatInputCommand: vi.fn(() => false),
    isAutocomplete: vi.fn(() => false),
    isModalSubmit: vi.fn(() => false),
    isButton: vi.fn(() => false),
    isUserSelectMenu: vi.fn(() => false),
    ...overrides,
  };
}

describe("bot/events/interactionCreate", () => {
  // テスト前にモック状態を初期化し、分岐ごとの副作用検証を安定化する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // イベントメタ情報が正しいことをまず担保する
  it("has expected event metadata", () => {
    expect(interactionCreateEvent.name).toBe(Events.InteractionCreate);
    expect(interactionCreateEvent.once).toBe(false);
  });

  // クールダウン中はコマンド実行せず Ephemeral 返信することを検証する
  it("replies cooldown message when command is in cooldown", async () => {
    const command = {
      data: { name: "ping" },
      cooldown: 5,
      execute: vi.fn(),
    };
    const interaction = createInteraction({
      isChatInputCommand: vi.fn(() => true),
    });
    interaction.client.commands.set("ping", command);
    interaction.client.cooldownManager.check.mockReturnValue(2);

    await interactionCreateEvent.execute(interaction as never);

    expect(tGuild).toHaveBeenCalledWith("guild-1", "commands:cooldown.wait", {
      seconds: 2,
    });
    expect(interaction.reply).toHaveBeenCalledWith({
      content: "guild:commands:cooldown.wait",
      flags: MessageFlags.Ephemeral,
    });
    expect(command.execute).not.toHaveBeenCalled();
  });

  // モーダルは registry の prefix match を優先して実行されることを確認する
  it("routes modal submit to registry handler first", async () => {
    const mockedModalModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      __mockModalHandler: {
        matches: Mock<(s: string) => boolean>;
        execute: Mock<(arg: unknown) => Promise<void>>;
      };
    };

    mockedModalModule.__mockModalHandler.matches.mockReturnValue(true);

    const interaction = createInteraction({
      customId: "vac:rename:123",
      isModalSubmit: vi.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(mockedModalModule.__mockModalHandler.execute).toHaveBeenCalledWith(
      interaction,
    );
  });

  // modal registry 実行失敗時は interaction error ハンドラへ委譲されることを検証
  it("delegates modal registry handler error to interaction error handler", async () => {
    const mockedModalModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      __mockModalHandler: {
        matches: Mock<(s: string) => boolean>;
        execute: Mock<(arg: unknown) => Promise<void>>;
      };
    };

    const modalError = new Error("registry modal failed");
    mockedModalModule.__mockModalHandler.matches.mockReturnValue(true);
    mockedModalModule.__mockModalHandler.execute.mockRejectedValue(modalError);

    const interaction = createInteraction({
      customId: "vac:rename:error",
      isModalSubmit: vi.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(
      interaction,
      modalError,
    );
  });

  // ボタン実行失敗時は handleInteractionError にフォールバックすることを検証する
  it("delegates button handler error to interaction error handler", async () => {
    const mockedButtonModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/buttons",
    ) as {
      __mockButtonHandler: {
        matches: Mock<(s: string) => boolean>;
        execute: Mock<(arg: unknown) => Promise<void>>;
      };
    };

    const error = new Error("button failed");
    mockedButtonModule.__mockButtonHandler.matches.mockReturnValue(true);
    mockedButtonModule.__mockButtonHandler.execute.mockRejectedValue(error);

    const interaction = createInteraction({
      customId: "button:1",
      isButton: vi.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(interaction, error);
  });

  // コマンド実行失敗時は handleCommandError に委譲されることを検証する
  it("delegates command error to handleCommandError", async () => {
    const error = new Error("command failed");
    const command = {
      data: { name: "ping" },
      cooldown: 3,
      execute: vi.fn().mockRejectedValue(error),
    };

    const interaction = createInteraction({
      isChatInputCommand: vi.fn(() => true),
    });
    interaction.client.commands.set("ping", command);

    await interactionCreateEvent.execute(interaction as never);

    expect(handleCommandError).toHaveBeenCalledWith(interaction, error);
  });

  // 未登録コマンド名は警告ログのみで終了することを検証
  it("warns and returns when command is not found", async () => {
    const interaction = createInteraction({
      isChatInputCommand: vi.fn(() => true),
      commandName: "unknown",
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(logger.warn).toHaveBeenCalledWith(
      "default:system:interaction.unknown_command",
    );
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  // ギルド外では tDefault のクールダウン文言を使うことを検証
  it("uses default cooldown message outside guild", async () => {
    const command = {
      data: { name: "ping" },
      cooldown: undefined,
      execute: vi.fn(),
    };
    const interaction = createInteraction({
      isChatInputCommand: vi.fn(() => true),
      guildId: "",
    });
    interaction.client.commands.set("ping", command);
    interaction.client.cooldownManager.check.mockReturnValue(1);

    await interactionCreateEvent.execute(interaction as never);

    expect(tGuild).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      content: "default:commands:cooldown.wait",
      flags: MessageFlags.Ephemeral,
    });
  });

  // クールダウン対象外ではコマンドが成功実行されることを検証
  it("executes command and logs debug when not in cooldown", async () => {
    const command = {
      data: { name: "ping" },
      cooldown: 3,
      execute: vi.fn().mockResolvedValue(undefined),
    };
    const interaction = createInteraction({
      isChatInputCommand: vi.fn(() => true),
    });
    interaction.client.commands.set("ping", command);
    interaction.client.cooldownManager.check.mockReturnValue(0);

    await interactionCreateEvent.execute(interaction as never);

    expect(command.execute).toHaveBeenCalledWith(interaction);
    expect(logger.debug).toHaveBeenCalledWith(
      "default:system:interaction.command_executed",
    );
  });

  // autocomplete 対応コマンドがある場合に実行されることを検証
  it("executes autocomplete handler when available", async () => {
    const autocomplete = vi.fn().mockResolvedValue(undefined);
    const command = {
      data: { name: "ping" },
      execute: vi.fn(),
      autocomplete,
    };
    const interaction = createInteraction({
      isAutocomplete: vi.fn(() => true),
    });
    interaction.client.commands.set("ping", command);

    await interactionCreateEvent.execute(interaction as never);

    expect(autocomplete).toHaveBeenCalledWith(interaction);
  });

  // autocomplete 非対応または未登録は何もせず終了することを検証
  it("returns on autocomplete when command is missing or no autocomplete", async () => {
    const interaction = createInteraction({
      isAutocomplete: vi.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    const commandWithoutAutocomplete = {
      data: { name: "ping" },
      execute: vi.fn(),
    };
    interaction.client.commands.set("ping", commandWithoutAutocomplete);
    await interactionCreateEvent.execute(interaction as never);

    expect(logger.error).not.toHaveBeenCalledWith(
      "default:system:interaction.autocomplete_error",
      expect.anything(),
    );
  });

  // autocomplete 失敗時はエラーログのみ行うことを検証
  it("logs error when autocomplete throws", async () => {
    const autocompleteError = new Error("autocomplete failed");
    const command = {
      data: { name: "ping" },
      execute: vi.fn(),
      autocomplete: vi.fn().mockRejectedValue(autocompleteError),
    };
    const interaction = createInteraction({
      isAutocomplete: vi.fn(() => true),
    });
    interaction.client.commands.set("ping", command);

    await interactionCreateEvent.execute(interaction as never);

    expect(logger.error).toHaveBeenCalledWith(
      "default:system:interaction.autocomplete_error",
      autocompleteError,
    );
  });

  // modal registry 非一致時は client.modals を使わず警告して終了することを検証
  it("does not use client modal collection when registry has no match", async () => {
    const mockedModalModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      __mockModalHandler: {
        matches: Mock<(s: string) => boolean>;
      };
    };
    mockedModalModule.__mockModalHandler.matches.mockReturnValue(false);

    const modalExecute = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteraction({
      isModalSubmit: vi.fn(() => true),
      customId: "modal:exact",
    });
    interaction.client.modals.set("modal:exact", { execute: modalExecute });

    await interactionCreateEvent.execute(interaction as never);

    expect(modalExecute).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "default:system:interaction.unknown_modal",
    );
  });

  // modal fallback でも見つからない場合は警告して終了することを検証
  it("warns when modal is unknown in both registry and collection", async () => {
    const mockedModalModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      __mockModalHandler: {
        matches: Mock<(s: string) => boolean>;
      };
    };
    mockedModalModule.__mockModalHandler.matches.mockReturnValue(false);

    const interaction = createInteraction({
      isModalSubmit: vi.fn(() => true),
      customId: "modal:missing",
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(logger.warn).toHaveBeenCalledWith(
      "default:system:interaction.unknown_modal",
    );
  });

  // registry 非一致時は fallback モーダルの失敗も発生せず interaction error へ委譲しない
  it("does not delegate modal collection errors when registry has no match", async () => {
    const mockedModalModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      __mockModalHandler: {
        matches: Mock<(s: string) => boolean>;
      };
    };
    mockedModalModule.__mockModalHandler.matches.mockReturnValue(false);

    const modalError = new Error("modal failed");
    const modalExecute = vi.fn().mockRejectedValue(modalError);
    const interaction = createInteraction({
      isModalSubmit: vi.fn(() => true),
      customId: "modal:error",
    });
    interaction.client.modals.set("modal:error", { execute: modalExecute });

    await interactionCreateEvent.execute(interaction as never);

    expect(modalExecute).not.toHaveBeenCalled();
    expect(handleInteractionError).not.toHaveBeenCalled();
  });

  // user select ハンドラ成功時に execute が呼ばれることを検証
  it("routes user select menu to handler", async () => {
    const mockedSelectModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/selectMenus",
    ) as {
      __mockUserSelectHandler: {
        matches: Mock<(s: string) => boolean>;
        execute: Mock<(arg: unknown) => Promise<void>>;
      };
    };
    mockedSelectModule.__mockUserSelectHandler.matches.mockReturnValue(true);

    const interaction = createInteraction({
      customId: "user-select:1",
      isUserSelectMenu: vi.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(
      mockedSelectModule.__mockUserSelectHandler.execute,
    ).toHaveBeenCalledWith(interaction);
  });

  // user select ハンドラ失敗時は interaction error ハンドラへ委譲することを検証
  it("delegates user select handler error to interaction error handler", async () => {
    const mockedSelectModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/selectMenus",
    ) as {
      __mockUserSelectHandler: {
        matches: Mock<(s: string) => boolean>;
        execute: Mock<(arg: unknown) => Promise<void>>;
      };
    };
    const selectError = new Error("select failed");
    mockedSelectModule.__mockUserSelectHandler.matches.mockReturnValue(true);
    mockedSelectModule.__mockUserSelectHandler.execute.mockRejectedValue(
      selectError,
    );

    const interaction = createInteraction({
      customId: "user-select:error",
      isUserSelectMenu: vi.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(
      interaction,
      selectError,
    );
  });

  // ボタンハンドラ未一致時は何も実行しないことを検証
  it("does nothing when no button handler matches", async () => {
    const mockedButtonModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/buttons",
    ) as {
      __mockButtonHandler: {
        matches: Mock<(s: string) => boolean>;
        execute: Mock<(arg: unknown) => Promise<void>>;
      };
    };
    mockedButtonModule.__mockButtonHandler.matches.mockReturnValue(false);

    const interaction = createInteraction({
      customId: "button:none",
      isButton: vi.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(
      mockedButtonModule.__mockButtonHandler.execute,
    ).not.toHaveBeenCalled();
    expect(handleInteractionError).not.toHaveBeenCalled();
  });

  // ユーザーセレクトハンドラ未一致時は何も実行しないことを検証
  it("does nothing when no user select handler matches", async () => {
    const mockedSelectModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/selectMenus",
    ) as {
      __mockUserSelectHandler: {
        matches: Mock<(s: string) => boolean>;
        execute: Mock<(arg: unknown) => Promise<void>>;
      };
    };
    mockedSelectModule.__mockUserSelectHandler.matches.mockReturnValue(false);

    const interaction = createInteraction({
      customId: "user-select:none",
      isUserSelectMenu: vi.fn(() => true),
    });

    await interactionCreateEvent.execute(interaction as never);

    expect(
      mockedSelectModule.__mockUserSelectHandler.execute,
    ).not.toHaveBeenCalled();
    expect(handleInteractionError).not.toHaveBeenCalled();
  });

  // どのinteraction種別にも該当しない場合は何もしないことを検証
  it("does nothing for unsupported interaction type", async () => {
    const interaction = createInteraction();

    await interactionCreateEvent.execute(interaction as never);

    expect(interaction.reply).not.toHaveBeenCalled();
    expect(handleCommandError).not.toHaveBeenCalled();
    expect(handleInteractionError).not.toHaveBeenCalled();
  });
});
