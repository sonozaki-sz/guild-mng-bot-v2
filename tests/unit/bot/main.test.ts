import type { Mock, MockInstance } from "vitest";
// bot/main の起動フロー（コマンド登録・イベント登録・エラー終了）を副作用隔離で検証
type BootOptions = {
  guildId?: string;
  restPutReject?: boolean;
  connectReject?: boolean;
};

type BootResult = {
  logger: {
    info: Mock;
    debug: Mock;
    error: Mock;
  };
  client: {
    rest: {
      setToken: Mock;
      put: Mock;
    };
    commands: {
      set: Mock;
    };
    login: Mock;
    shutdown: Mock;
  };
  prisma: {
    $connect: Mock;
    $disconnect: Mock;
  };
  setupGlobalErrorHandlers: Mock;
  setupGracefulShutdown: Mock;
  registerBotEvents: Mock;
  routes: {
    applicationGuildCommands: Mock;
    applicationCommands: Mock;
  };
  processExitSpy: MockInstance;
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

// vi.hoisted で各モジュールの可変参照を作成する
// bootMain が呼ばれるたびに実装を差し替えるためのコンテナ
const mutableMocks = vi.hoisted(() => ({
  prisma: null as null | {
    $connect: Mock;
    $disconnect: Mock;
  },
  client: null as null | {
    rest: { setToken: Mock; put: Mock };
    commands: { set: Mock };
    login: Mock;
    shutdown: Mock;
  },
  logger: null as null | { info: Mock; debug: Mock; error: Mock },
  setupGlobalErrorHandlers: null as null | Mock,
  setupGracefulShutdown: null as null | Mock,
  registerBotEvents: null as null | Mock,
  routes: null as null | {
    applicationGuildCommands: Mock;
    applicationCommands: Mock;
  },
  guildId: undefined as string | undefined,
}));

// vi.resetModules()後もコンストラクタとして動作するよう、
// アロー関数でなくfunction式を使ってvi.fn()に渡す
vi.mock("@prisma/adapter-libsql", () => ({
  PrismaLibSql: vi.fn(function (this: unknown) {
    return {};
  }),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(function (this: unknown) {
    return mutableMocks.prisma;
  }),
}));

vi.mock("discord.js", () => ({
  Routes: {
    applicationGuildCommands: vi.fn((...args: unknown[]) =>
      mutableMocks.routes?.applicationGuildCommands(...args),
    ),
    applicationCommands: vi.fn((...args: unknown[]) =>
      mutableMocks.routes?.applicationCommands(...args),
    ),
  },
}));

vi.mock("@/shared/config/env", () => ({
  get env() {
    return {
      DATABASE_URL: "file::memory:?cache=shared",
      DISCORD_TOKEN: "test-token",
      DISCORD_APP_ID: "123456",
      DISCORD_GUILD_ID: mutableMocks.guildId,
    };
  },
}));

vi.mock("@/shared/errors/errorHandler", () => ({
  get setupGlobalErrorHandlers() {
    return mutableMocks.setupGlobalErrorHandlers;
  },
  get setupGracefulShutdown() {
    return mutableMocks.setupGracefulShutdown;
  },
}));

vi.mock("@/shared/locale/localeManager", () => ({
  localeManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    setRepository: vi.fn(),
  },
  tDefault: vi.fn((key: string) => key),
}));

vi.mock("@/shared/utils/logger", () => ({
  get logger() {
    return mutableMocks.logger;
  },
}));

vi.mock("@/shared/utils/prisma", () => ({
  setPrismaClient: vi.fn(),
}));

vi.mock("@/bot/services/botEventRegistration", () => ({
  get registerBotEvents() {
    return mutableMocks.registerBotEvents;
  },
}));

vi.mock("@/bot/services/botCompositionRoot", () => ({
  initializeBotCompositionRoot: vi.fn(),
}));

vi.mock("@/bot/client", () => ({
  createBotClient: vi.fn(() => mutableMocks.client),
}));

vi.mock("@/bot/commands/commands", () => ({
  commands: [
    {
      data: {
        name: "ping",
        toJSON: vi.fn(() => ({ name: "ping" })),
      },
    },
  ],
}));

vi.mock("@/bot/events/events", () => ({
  events: [
    {
      name: "ready",
      once: true,
      execute: vi.fn(),
    },
  ],
}));

// import 時に起動される main.ts を安全に検証するため、依存を全面モックしてブートする
async function bootMain(options: BootOptions = {}): Promise<BootResult> {
  const routes = {
    applicationGuildCommands: vi.fn(() => "guild-route"),
    applicationCommands: vi.fn(() => "global-route"),
  };

  const prisma = {
    $connect: options.connectReject
      ? vi.fn().mockRejectedValue(new Error("connect failed"))
      : vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };

  const client = {
    rest: {
      setToken: vi.fn(),
      put: options.restPutReject
        ? vi.fn().mockRejectedValue(new Error("put failed"))
        : vi.fn().mockResolvedValue(undefined),
    },
    commands: {
      set: vi.fn(),
    },
    login: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
  };

  const setupGlobalErrorHandlers = vi.fn();
  const setupGracefulShutdown = vi.fn();
  const registerBotEvents = vi.fn();

  const logger = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  };

  // mutableMocks に値をセット（モック内の getter/forwarder が参照する）
  mutableMocks.prisma = prisma;
  mutableMocks.client = client;
  mutableMocks.logger = logger;
  mutableMocks.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
  mutableMocks.setupGracefulShutdown = setupGracefulShutdown;
  mutableMocks.registerBotEvents = registerBotEvents;
  mutableMocks.routes = routes;
  mutableMocks.guildId = options.guildId;

  const processExitSpy = vi
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never);

  vi.resetModules();
  await import("@/bot/main");
  await flushMicrotasks();

  return {
    logger,
    client,
    prisma,
    setupGlobalErrorHandlers,
    setupGracefulShutdown,
    registerBotEvents,
    routes,
    processExitSpy,
  };
}

describe("bot/main", () => {
  // process.exit スパイを含むグローバルモックをケースごとに復元する
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ギルドコマンド登録とイベント登録、ログイン、graceful shutdown の主経路を検証
  it("registers guild commands and events then logs in", async () => {
    const boot = await bootMain({ guildId: "guild-1" });

    expect(boot.setupGlobalErrorHandlers).toHaveBeenCalledTimes(1);
    expect(boot.client.rest.setToken).toHaveBeenCalledWith("test-token");
    expect(boot.routes.applicationGuildCommands).toHaveBeenCalledWith(
      "123456",
      "guild-1",
    );
    expect(boot.client.rest.put).toHaveBeenCalledWith("guild-route", {
      body: [{ name: "ping" }],
    });
    expect(boot.client.commands.set).toHaveBeenCalledWith(
      "ping",
      expect.any(Object),
    );
    expect(boot.registerBotEvents).toHaveBeenCalledTimes(1);
    expect(boot.client.login).toHaveBeenCalledWith("test-token");

    const shutdownHandler = boot.setupGracefulShutdown.mock
      .calls[0][0] as () => Promise<void>;
    await shutdownHandler();

    expect(boot.client.shutdown).toHaveBeenCalledTimes(1);
    expect(boot.prisma.$disconnect).toHaveBeenCalled();
  });

  // DISCORD_GUILD_ID 未設定時にグローバルコマンド経路へ分岐することを検証
  it("registers global commands when DISCORD_GUILD_ID is undefined", async () => {
    const boot = await bootMain();

    expect(boot.routes.applicationCommands).toHaveBeenCalledWith("123456");
    expect(boot.client.rest.put).toHaveBeenCalledWith("global-route", {
      body: [{ name: "ping" }],
    });
    expect(boot.processExitSpy).not.toHaveBeenCalled();
  });

  // 起動 try ブロック内の失敗でエラーログと終了コードが設定されることを検証
  it("handles startup error in try block and exits", async () => {
    const boot = await bootMain({ guildId: "guild-1", restPutReject: true });

    expect(boot.logger.error).toHaveBeenCalledWith(
      "system:bot.startup.error",
      expect.any(Error),
    );
    expect(boot.prisma.$disconnect).toHaveBeenCalled();
    expect(boot.processExitSpy).toHaveBeenCalledWith(1);
  });

  // 起動前段（接続処理）失敗で outer catch が処理することを検証
  it("handles startup failure before try block and exits", async () => {
    const boot = await bootMain({ connectReject: true });

    expect(boot.logger.error).toHaveBeenCalledWith(
      "system:bot.startup.failed",
      expect.any(Error),
    );
    expect(boot.processExitSpy).toHaveBeenCalledWith(1);
  });
});
