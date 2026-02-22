/**
 * Environment Configuration Unit Tests
 * 環境変数設定のテスト
 */

describe("Environment Configuration", () => {
  // 必須/任意項目・型変換・列挙値の環境変数バリデーションを検証
  const originalEnv = { ...process.env };

  // process.env オブジェクトを差し替えず、キー単位で初期状態へ戻す
  const restoreEnv = () => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }

    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
  };

  // 各テスト前にモジュールキャッシュを破棄し、環境変数を初期状態へ戻す
  beforeEach(() => {
    vi.resetModules();
    restoreEnv();
  });

  // テスト後に process.env を元に戻して副作用を防止
  afterEach(() => {
    restoreEnv();
  });

  describe("Required Fields", () => {
    it("should parse valid environment variables", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "super-secret-key-for-production"; // 本番環境では必須

      const { env } = await import("@/shared/config/env");

      expect(env.DISCORD_TOKEN).toBe("a".repeat(50));
      expect(env.DISCORD_APP_ID).toBe("1234567890");
      expect(env.NODE_ENV).toBe("production");
    });

    it("should use default values for optional fields", async () => {
      // 任意項目を未設定にし、デフォルト値の適用を確認
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      // NODE_ENVはsetup.tsで"test"に設定されている
      delete process.env.LOCALE;
      delete process.env.WEB_PORT;
      delete process.env.WEB_HOST;

      const { env } = await import("@/shared/config/env");

      expect(env.NODE_ENV).toBe("test"); // setup.tsで設定済み
      expect(env.LOCALE).toBe("ja");
      // LOG_LEVELはenv.tsのデフォルト値が適用される
      expect(["info", "error"]).toContain(env.LOG_LEVEL);
      expect(env.WEB_PORT).toBe(3000);
      expect(env.WEB_HOST).toBe("0.0.0.0");
    });
  });

  describe("Type Coercion", () => {
    it("should coerce WEB_PORT to number", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.WEB_PORT = "8080";

      const { env } = await import("@/shared/config/env");

      expect(env.WEB_PORT).toBe(8080);
      expect(typeof env.WEB_PORT).toBe("number");
    });
  });

  describe("Enum Validation", () => {
    it("should accept valid NODE_ENV values", async () => {
      const validEnvs = ["development", "production", "test"];

      // 有効な NODE_ENV 値を順番に検証
      for (const nodeEnv of validEnvs) {
        vi.resetModules();
        restoreEnv();
        process.env.DISCORD_TOKEN = "a".repeat(50);
        process.env.DISCORD_APP_ID = "1234567890";
        process.env.NODE_ENV = nodeEnv;
        // 本番環境ではJWT_SECRETが必須
        if (nodeEnv === "production") {
          process.env.JWT_SECRET = "test-jwt-secret-for-production";
        }

        const { env } = await import("@/shared/config/env");
        expect(env.NODE_ENV).toBe(nodeEnv);
      }
    });

    it("should accept valid LOG_LEVEL values", async () => {
      const validLevels = ["trace", "debug", "info", "warn", "error"];

      // 有効な LOG_LEVEL 値を順番に検証
      for (const level of validLevels) {
        vi.resetModules();
        restoreEnv();
        process.env.DISCORD_TOKEN = "a".repeat(50);
        process.env.DISCORD_APP_ID = "1234567890";
        process.env.LOG_LEVEL = level;

        const { env } = await import("@/shared/config/env");
        expect(env.LOG_LEVEL).toBe(level);
      }
    });
  });

  describe("Optional Fields", () => {
    it("should handle optional DISCORD_GUILD_ID", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.DISCORD_GUILD_ID = "9876543210";

      const { env } = await import("@/shared/config/env");

      expect(env.DISCORD_GUILD_ID).toBe("9876543210");
    });

    it("should handle optional JWT_SECRET", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.JWT_SECRET = "my-secret-key";

      const { env } = await import("@/shared/config/env");

      expect(env.JWT_SECRET).toBe("my-secret-key");
    });
  });

  describe("Database Configuration", () => {
    it("should use DATABASE_URL from setup", async () => {
      // setup.ts で注入されるテスト用 DATABASE_URL を利用すること
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      // DATABASE_URLはsetup.tsで設定済み

      const { env } = await import("@/shared/config/env");

      expect(env.DATABASE_URL).toBe("file::memory:?cache=shared");
    });

    it("should accept custom DATABASE_URL", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.DATABASE_URL = "file:./custom/path/db.sqlite";

      const { env } = await import("@/shared/config/env");

      expect(env.DATABASE_URL).toBe("file:./custom/path/db.sqlite");
    });
  });

  describe("Web Server Configuration", () => {
    it("should handle custom WEB_PORT and WEB_HOST", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.WEB_PORT = "5000";
      process.env.WEB_HOST = "127.0.0.1";

      const { env } = await import("@/shared/config/env");

      expect(env.WEB_PORT).toBe(5000);
      expect(env.WEB_HOST).toBe("127.0.0.1");
    });
  });

  describe("Locale Configuration", () => {
    it("should accept custom locale", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.LOCALE = "en";

      const { env } = await import("@/shared/config/env");

      expect(env.LOCALE).toBe("en");
    });
  });

  describe("Warning and Failure Paths", () => {
    it("should warn when JWT_SECRET is missing in non-production", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.NODE_ENV = "test";
      delete process.env.JWT_SECRET;

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());

      const { env } = await import("@/shared/config/env");

      expect(env.NODE_ENV).toBe("test");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("JWT_SECRET is not set"),
      );
    });

    it("should log validation errors and exit when production JWT_SECRET is missing", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.NODE_ENV = "production";
      delete process.env.JWT_SECRET;

      const errorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("EXIT");
      }) as never);

      await expect(import("@/shared/config/env")).rejects.toThrow("EXIT");
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Environment variable validation failed:",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("JWT_SECRET is required in production"),
      );
      expect(errorSpy).toHaveBeenCalledWith("\nPlease check your .env file.");
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("should exit on non-Zod error during env parsing", async () => {
      process.env.DISCORD_TOKEN = "a".repeat(50);
      process.env.DISCORD_APP_ID = "1234567890";
      process.env.NODE_ENV = "test";
      delete process.env.JWT_SECRET;

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        throw new Error("warn-failed");
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("EXIT");
      }) as never);

      await expect(import("@/shared/config/env")).rejects.toThrow("EXIT");
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalledWith(
        "❌ Environment variable validation failed:",
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
