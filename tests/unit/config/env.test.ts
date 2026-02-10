/**
 * Environment Configuration Unit Tests
 * 環境変数設定のテスト
 */

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Required Fields", () => {
    it("should parse valid environment variables", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.NODE_ENV = "production";

      const { env } = require("../../../src/shared/config/env");

      expect(env.DISCORD_TOKEN).toBe("a".repeat(50));
      expect(env.DISCORD_APP_ID).toBe("1234567890");
      expect(env.NODE_ENV).toBe("production");
    });

    it("should use default values for optional fields", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      // NODE_ENVはsetup.tsで"test"に設定されている
      delete process.env.LOCALE;
      delete process.env.WEB_PORT;
      delete process.env.WEB_HOST;

      const { env } = require("../../../src/shared/config/env");

      expect(env.NODE_ENV).toBe("test"); // setup.tsで設定済み
      expect(env.LOCALE).toBe("ja");
      // LOG_LEVELはenv.tsのデフォルト値が適用される
      expect(["info", "error"]).toContain(env.LOG_LEVEL);
      expect(env.WEB_PORT).toBe(3000);
      expect(env.WEB_HOST).toBe("0.0.0.0");
    });
  });

  describe("Type Coercion", () => {
    it("should coerce WEB_PORT to number", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.WEB_PORT = "8080";

      const { env } = require("../../../src/shared/config/env");

      expect(env.WEB_PORT).toBe(8080);
      expect(typeof env.WEB_PORT).toBe("number");
    });
  });

  describe("Enum Validation", () => {
    it("should accept valid NODE_ENV values", () => {
      const validEnvs = ["development", "production", "test"];

      validEnvs.forEach((nodeEnv) => {
        jest.resetModules();
        process.env = { ...originalEnv };
        process.env.DISCORD_TOKEN = "a".repeat(50);
        process.env.DISCORD_APP_ID = "1234567890";
        process.env.NODE_ENV = nodeEnv;

        const { env } = require("../../../src/shared/config/env");
        expect(env.NODE_ENV).toBe(nodeEnv);
      });
    });

    it("should accept valid LOG_LEVEL values", () => {
      const validLevels = ["trace", "debug", "info", "warn", "error"];

      validLevels.forEach((level) => {
        jest.resetModules();
        process.env = { ...originalEnv };
        process.env.DISCORD_TOKEN = "a".repeat(50);
        process.env.DISCORD_APP_ID = "1234567890";
        process.env.LOG_LEVEL = level;

        const { env } = require("../../../src/shared/config/env");
        expect(env.LOG_LEVEL).toBe(level);
      });
    });
  });

  describe("Optional Fields", () => {
    it("should handle optional DISCORD_GUILD_ID", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.DISCORD_GUILD_ID = "9876543210";

      const { env } = require("../../../src/shared/config/env");

      expect(env.DISCORD_GUILD_ID).toBe("9876543210");
    });

    it("should handle optional JWT_SECRET", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.JWT_SECRET = "my-secret-key";

      const { env } = require("../../../src/shared/config/env");

      expect(env.JWT_SECRET).toBe("my-secret-key");
    });
  });

  describe("Database Configuration", () => {
    it("should use DATABASE_URL from setup", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      // DATABASE_URLはsetup.tsで設定済み

      const { env } = require("../../../src/shared/config/env");

      expect(env.DATABASE_URL).toBe("file::memory:?cache=shared");
    });

    it("should accept custom DATABASE_URL", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.DATABASE_URL = "file:./custom/path/db.sqlite";

      const { env } = require("../../../src/shared/config/env");

      expect(env.DATABASE_URL).toBe("file:./custom/path/db.sqlite");
    });
  });

  describe("Web Server Configuration", () => {
    it("should handle custom WEB_PORT and WEB_HOST", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.WEB_PORT = "5000";
      process.env.WEB_HOST = "127.0.0.1";

      const { env } = require("../../../src/shared/config/env");

      expect(env.WEB_PORT).toBe(5000);
      expect(env.WEB_HOST).toBe("127.0.0.1");
    });
  });

  describe("Locale Configuration", () => {
    it("should accept custom locale", () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.LOCALE = "en";

      const { env } = require("../../../src/shared/config/env");

      expect(env.LOCALE).toBe("en");
    });
  });
});
