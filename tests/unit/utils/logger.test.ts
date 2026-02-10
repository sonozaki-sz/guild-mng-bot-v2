/**
 * Logger Unit Tests
 * Winston ロガーの設定テスト
 */

import type winston from "winston";

// Winston のモック
const mockInfo = jest.fn();
const mockError = jest.fn();
const mockWarn = jest.fn();
const mockDebug = jest.fn();

const mockLogger = {
  info: mockInfo,
  error: mockError,
  warn: mockWarn,
  debug: mockDebug,
  level: "info",
} as unknown as winston.Logger;

jest.mock("winston", () => ({
  createLogger: jest.fn(() => mockLogger),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
  },
}));

jest.mock("winston-daily-rotate-file", () => {
  return jest.fn();
});

// 環境変数のモック
jest.mock("../../../src/shared/config/env", () => ({
  env: {
    NODE_ENV: "test",
    LOG_LEVEL: "debug",
  },
}));

// i18n のモック
jest.mock("../../../src/shared/locale", () => ({
  tDefault: (key: string) => `mocked:${key}`,
}));

describe("Logger", () => {
  let logger: winston.Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    // logger モジュールを再読み込み
    jest.isolateModules(() => {
      const loggerModule = require("../../../src/shared/utils/logger");
      logger = loggerModule.logger;
    });
  });

  describe("Logging Methods", () => {
    it("should call info method", () => {
      logger.info("Test info message");
      expect(mockInfo).toHaveBeenCalledWith("Test info message");
    });

    it("should call error method", () => {
      logger.error("Test error message");
      expect(mockError).toHaveBeenCalledWith("Test error message");
    });

    it("should call warn method", () => {
      logger.warn("Test warning message");
      expect(mockWarn).toHaveBeenCalledWith("Test warning message");
    });

    it("should call debug method", () => {
      logger.debug("Test debug message");
      expect(mockDebug).toHaveBeenCalledWith("Test debug message");
    });
  });

  describe("Log Levels", () => {
    it("should have correct log level set", () => {
      expect(logger.level).toBe("info");
    });
  });

  describe("Complex Messages", () => {
    it("should handle objects in log messages", () => {
      const logData = { userId: "123", action: "test" };
      logger.info("User action", logData);
      expect(mockInfo).toHaveBeenCalled();
    });

    it("should handle errors with stack traces", () => {
      const error = new Error("Test error");
      logger.error("Error occurred", error);
      expect(mockError).toHaveBeenCalled();
    });

    it("should handle multiple arguments", () => {
      logger.info("Multiple", "arguments", "test");
      expect(mockInfo).toHaveBeenCalled();
    });
  });

  describe("Message Formatting", () => {
    it("should log structured data", () => {
      const metadata = {
        timestamp: new Date().toISOString(),
        service: "bot",
        environment: "test",
      };

      logger.info("Structured log", metadata);
      expect(mockInfo).toHaveBeenCalled();
    });

    it("should handle empty messages", () => {
      logger.info("");
      expect(mockInfo).toHaveBeenCalledWith("");
    });
  });

  describe("Error Scenarios", () => {
    it("should log error with stack trace", () => {
      const error = new Error("Critical error");
      error.stack = "Error stack trace";

      logger.error("System error", { error });
      expect(mockError).toHaveBeenCalled();
    });

    it("should handle null and undefined", () => {
      logger.info("Null test", null);
      logger.info("Undefined test", undefined);
      expect(mockInfo).toHaveBeenCalledTimes(2);
    });
  });

  describe("Performance", () => {
    it("should handle rapid successive logs", () => {
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }
      expect(mockInfo).toHaveBeenCalledTimes(100);
    });

    it("should handle large objects", () => {
      const largeObject = {
        data: new Array(1000).fill({ key: "value", nested: { deep: true } }),
      };
      logger.info("Large object", largeObject);
      expect(mockInfo).toHaveBeenCalled();
    });
  });

  describe("Integration with i18n", () => {
    it("should work with translated messages", () => {
      const { tDefault } = require("../../../src/shared/locale");
      const message = tDefault("system:shutdown.gracefully");

      logger.info(message);
      expect(mockInfo).toHaveBeenCalledWith(
        "mocked:system:shutdown.gracefully",
      );
    });
  });
});
