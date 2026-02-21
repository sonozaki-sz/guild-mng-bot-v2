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
    jest.doMock("@/shared/config", () => ({
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
});
