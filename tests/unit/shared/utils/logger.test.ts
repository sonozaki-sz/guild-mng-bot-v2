describe("Logger", () => {
  const loadLoggerModule = async (
    nodeEnv: "development" | "production" | "test",
    logLevel?: string,
  ) => {
    jest.resetModules();

    const consoleTransportMock = jest.fn();
    const dailyRotateMock = jest.fn();
    const createLoggerMock = jest.fn((options) => ({ ...options }));

    const winstonMock = {
      createLogger: createLoggerMock,
      format: {
        combine: jest.fn((...parts) => ({ type: "combine", parts })),
        timestamp: jest.fn((opts) => ({ type: "timestamp", opts })),
        printf: jest.fn((fn) => ({ type: "printf", fn })),
        colorize: jest.fn(() => ({ type: "colorize" })),
      },
      transports: {
        Console: consoleTransportMock,
      },
    };

    jest.doMock("winston", () => ({ __esModule: true, default: winstonMock }));
    jest.doMock("winston-daily-rotate-file", () => ({
      __esModule: true,
      default: dailyRotateMock,
    }));
    jest.doMock("@/shared/config/env", () => ({
      NODE_ENV: {
        DEVELOPMENT: "development",
        PRODUCTION: "production",
        TEST: "test",
      },
      env: {
        NODE_ENV: nodeEnv,
        LOG_LEVEL: logLevel,
      },
    }));

    const module = await import("@/shared/utils/logger");
    return {
      module,
      winstonMock,
      createLoggerMock,
      consoleTransportMock,
      dailyRotateMock,
    };
  };

  it("configures development logger with debug-level console and two rotate files", async () => {
    const { module, createLoggerMock, consoleTransportMock, dailyRotateMock } =
      await loadLoggerModule("development", "debug");

    expect(module.logger).toBeDefined();
    expect(dailyRotateMock).toHaveBeenCalledTimes(2);
    expect(consoleTransportMock).toHaveBeenCalledTimes(1);
    expect(consoleTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ level: "debug" }),
    );

    const createLoggerArgs = createLoggerMock.mock.calls[0][0];
    expect(createLoggerArgs.level).toBe("debug");
    expect(createLoggerArgs.exitOnError).toBe(false);
    expect(createLoggerArgs.transports).toHaveLength(3);
  });

  it("configures non-development logger with info-level console and defaults", async () => {
    const { createLoggerMock, consoleTransportMock, dailyRotateMock } =
      await loadLoggerModule("production", undefined);

    expect(dailyRotateMock).toHaveBeenCalledTimes(2);
    expect(consoleTransportMock).toHaveBeenCalledTimes(1);
    expect(consoleTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ level: "info" }),
    );

    const createLoggerArgs = createLoggerMock.mock.calls[0][0];
    expect(createLoggerArgs.level).toBe("info");
    expect(createLoggerArgs.transports).toHaveLength(3);
  });

  it("formats console output with and without stack in development", async () => {
    const { winstonMock } = await loadLoggerModule("development", "debug");

    const printfCalls = winstonMock.format.printf.mock.calls;
    const consolePrintf = printfCalls[1]?.[0] as
      | ((entry: {
          timestamp: string;
          level: string;
          message: string;
          stack?: string;
        }) => string)
      | undefined;

    expect(consolePrintf).toBeDefined();
    expect(
      consolePrintf?.({
        timestamp: "2026-02-21 00:00:00",
        level: "info",
        message: "hello",
      }),
    ).toBe("2026-02-21 00:00:00 [info]: hello");
    expect(
      consolePrintf?.({
        timestamp: "2026-02-21 00:00:00",
        level: "error",
        message: "boom",
        stack: "STACK_TRACE",
      }),
    ).toBe("2026-02-21 00:00:00 [error]: boom\nSTACK_TRACE");
  });

  it("formats file output with meta and optional stack", async () => {
    const { winstonMock } = await loadLoggerModule("development", "debug");

    const printfCalls = winstonMock.format.printf.mock.calls;
    const filePrintf = printfCalls[0]?.[0] as
      | ((entry: {
          timestamp: string;
          level: string;
          message: string;
          stack?: string;
          [key: string]: unknown;
        }) => string)
      | undefined;

    expect(
      filePrintf?.({
        timestamp: "2026-02-21 00:00:00",
        level: "info",
        message: "hello",
      }),
    ).toBe("2026-02-21 00:00:00 [INFO]: hello");
    expect(
      filePrintf?.({
        timestamp: "2026-02-21 00:00:00",
        level: "error",
        message: "boom",
        stack: "STACK_TRACE",
        guildId: "g1",
      }),
    ).toBe('2026-02-21 00:00:00 [ERROR]: boom{"guildId":"g1"}\nSTACK_TRACE');
  });

  it("uses debug default level when LOG_LEVEL is missing in development", async () => {
    const { consoleTransportMock } = await loadLoggerModule(
      "development",
      undefined,
    );

    expect(consoleTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ level: "debug" }),
    );
  });
});
