// bot/main の起動フロー（コマンド登録・イベント登録・エラー終了）を副作用隔離で検証
type BootOptions = {
  guildId?: string;
  restPutReject?: boolean;
  connectReject?: boolean;
};

type BootResult = {
  logger: {
    info: jest.Mock;
    debug: jest.Mock;
    error: jest.Mock;
  };
  client: {
    rest: {
      setToken: jest.Mock;
      put: jest.Mock;
    };
    commands: {
      set: jest.Mock;
    };
    login: jest.Mock;
    shutdown: jest.Mock;
  };
  prisma: {
    $connect: jest.Mock;
    $disconnect: jest.Mock;
  };
  setupGlobalErrorHandlers: jest.Mock;
  setupGracefulShutdown: jest.Mock;
  registerBotEvents: jest.Mock;
  routes: {
    applicationGuildCommands: jest.Mock;
    applicationCommands: jest.Mock;
  };
  processExitSpy: jest.SpyInstance;
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

// import 時に起動される main.ts を安全に検証するため、依存を全面モックしてブートする
async function bootMain(options: BootOptions = {}): Promise<BootResult> {
  jest.resetModules();

  const prisma = {
    $connect: options.connectReject
      ? jest.fn().mockRejectedValue(new Error("connect failed"))
      : jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  const client = {
    rest: {
      setToken: jest.fn(),
      put: options.restPutReject
        ? jest.fn().mockRejectedValue(new Error("put failed"))
        : jest.fn().mockResolvedValue(undefined),
    },
    commands: {
      set: jest.fn(),
    },
    login: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
  };

  const setupGlobalErrorHandlers = jest.fn();
  const setupGracefulShutdown = jest.fn();
  const registerBotEvents = jest.fn();

  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  const routes = {
    applicationGuildCommands: jest.fn(() => "guild-route"),
    applicationCommands: jest.fn(() => "global-route"),
  };

  const processExitSpy = jest
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never);

  const command = {
    data: {
      name: "ping",
      toJSON: jest.fn(() => ({ name: "ping" })),
    },
  };

  const event = {
    name: "ready",
    once: true,
    execute: jest.fn(),
  };

  jest.doMock("@prisma/adapter-libsql", () => ({
    PrismaLibSql: jest.fn().mockImplementation(() => ({})),
  }));

  jest.doMock("@prisma/client", () => ({
    PrismaClient: jest.fn().mockImplementation(() => prisma),
  }));

  jest.doMock("discord.js", () => ({
    Routes: routes,
  }));

  jest.doMock("../../../src/shared/config/env", () => ({
    env: {
      DATABASE_URL: "file::memory:?cache=shared",
      DISCORD_TOKEN: "test-token",
      DISCORD_APP_ID: "123456",
      DISCORD_GUILD_ID: options.guildId,
    },
  }));

  jest.doMock("../../../src/shared/database", () => ({
    getGuildConfigRepository: jest.fn(() => ({ mocked: true })),
  }));

  jest.doMock("../../../src/shared/errors", () => ({
    setupGlobalErrorHandlers,
    setupGracefulShutdown,
  }));

  jest.doMock("../../../src/shared/locale", () => ({
    localeManager: {
      initialize: jest.fn().mockResolvedValue(undefined),
      setRepository: jest.fn(),
    },
    tDefault: jest.fn((key: string) => key),
  }));

  jest.doMock("../../../src/shared/utils", () => ({
    logger,
    setPrismaClient: jest.fn(),
  }));

  jest.doMock("../../../src/bot/services/botEventRegistration", () => ({
    registerBotEvents,
  }));

  jest.doMock("../../../src/bot/services/botCompositionRoot", () => ({
    initializeBotCompositionRoot: jest.fn(),
  }));

  jest.doMock("../../../src/bot/client", () => ({
    createBotClient: jest.fn(() => client),
  }));

  jest.doMock("../../../src/bot/commands", () => ({
    commands: [command],
  }));

  jest.doMock("../../../src/bot/events", () => ({
    events: [event],
  }));

  await import("../../../src/bot/main");
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
    jest.restoreAllMocks();
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
