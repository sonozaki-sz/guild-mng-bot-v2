// tests/unit/shared/locale/i18n.test.ts
// i18n モジュールの初期化設定（ロケール定数・i18next オプション・debug フラグ）と
// addResources / changeLanguage / t のラッパーが i18next に正しく委譲するかを検証する
describe("shared/locale/i18n", () => {
  const loadModule = async (nodeEnv: "development" | "production" | "test") => {
    vi.resetModules();

    const i18nextMock = {
      init: vi.fn().mockResolvedValue(undefined),
      addResourceBundle: vi.fn(),
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      t: vi.fn((key: string) => `translated:${key}`),
    };

    vi.doMock("i18next", () => ({
      __esModule: true,
      default: i18nextMock,
    }));

      vi.doMock("@/shared/config/env", () => ({
      NODE_ENV: {
        DEVELOPMENT: "development",
        PRODUCTION: "production",
        TEST: "test",
      },
      env: {
        NODE_ENV: nodeEnv,
      },
    }));

    const module = await import("@/shared/locale/i18n");
    return { module, i18nextMock };
  };

  it("exports supported/default locale constants", async () => {
    const { module } = await loadModule("test");

    expect(module.SUPPORTED_LOCALES).toEqual(["ja", "en"]);
    expect(module.DEFAULT_LOCALE).toBe("ja");
  });

  it("initializes i18next with expected options in development", async () => {
    const { module, i18nextMock } = await loadModule("development");

    const instance = await module.initI18n();
    expect(instance).toBe(i18nextMock);
    expect(i18nextMock.init).toHaveBeenCalledWith(
      expect.objectContaining({
        lng: "ja",
        fallbackLng: "ja",
        debug: true,
        resources: {},
        keySeparator: false,
        ns: ["common", "commands", "errors", "events", "system"],
        defaultNS: "common",
      }),
    );
  });

  // 本番・テスト環境では i18next の debug ログを無効化して余分な出力を抑制することを確認
  it("sets debug false outside development", async () => {
    const { module, i18nextMock } = await loadModule("production");
    await module.initI18n();

    expect(i18nextMock.init).toHaveBeenCalledWith(
      expect.objectContaining({ debug: false }),
    );
  });

  // addResources が merge フラグ付きで addResourceBundle を呼び出し、changeLanguage が委譲されることを確認
  it("delegates addResources and changeLanguage to i18next", async () => {
    const { module, i18nextMock } = await loadModule("test");

    module.addResources("ja", "commands", { "ping.description": "ピング" });
    expect(i18nextMock.addResourceBundle).toHaveBeenCalledWith(
      "ja",
      "commands",
      { "ping.description": "ピング" },
      true,
      true,
    );

    await module.changeLanguage("en");
    expect(i18nextMock.changeLanguage).toHaveBeenCalledWith("en");
  });

  it("exports bound translator function", async () => {
    const { module, i18nextMock } = await loadModule("test");

    expect(module.t("ping.description" as never)).toBe(
      "translated:ping.description",
    );
    expect(i18nextMock.t).toHaveBeenCalledWith("ping.description");
  });
});
