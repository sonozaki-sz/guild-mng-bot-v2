import type { Mock } from "vitest";

const initMock: Mock = vi.fn();
const translateMock: Mock = vi.fn();
const getFixedTMock: Mock = vi.fn();

const loggerMock = {
  info: vi.fn(),
  error: vi.fn(),
};

vi.mock("i18next", () => ({
  __esModule: true,
  default: {
    init: (...args: unknown[]) => initMock(...args),
    t: (...args: unknown[]) => translateMock(...args),
    getFixedT: (...args: unknown[]) => getFixedTMock(...args),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: loggerMock,
}));

describe("shared/locale/localeManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initMock.mockResolvedValue(undefined);
    translateMock.mockImplementation(
      (key: string, options?: { lng?: string }) =>
        `${options?.lng ?? "ja"}:${key}`,
    );
    getFixedTMock.mockImplementation(
      (locale: string) => (key: string) => `${locale}:${key}`,
    );
  });

  it("initializes i18next only once for concurrent calls", async () => {
    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const manager = new LocaleManager("ja");

    await Promise.all([manager.initialize(), manager.initialize()]);

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledTimes(1);
  });

  it("returns immediately when initialize is called after already initialized", async () => {
    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const manager = new LocaleManager("ja");

    await manager.initialize();
    await manager.initialize();

    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it("resets pending init promise after failure and allows retry", async () => {
    const initializeError = new Error("init failed");
    initMock
      .mockRejectedValueOnce(initializeError)
      .mockResolvedValueOnce(undefined);

    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const manager = new LocaleManager("ja");

    await expect(manager.initialize()).rejects.toThrow("init failed");
    await expect(manager.initialize()).resolves.toBeUndefined();
    expect(initMock).toHaveBeenCalledTimes(2);
  });

  it("translates with cached guild locale and avoids duplicate repository queries", async () => {
    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const manager = new LocaleManager("ja");
    const repository = {
      getLocale: vi.fn().mockResolvedValue("en"),
    };

    manager.setRepository(repository as never);

    await expect(
      manager.translate("guild-1", "ping.description" as never),
    ).resolves.toBe("en:ping.description");
    await expect(
      manager.translate("guild-1", "afk.description" as never),
    ).resolves.toBe("en:afk.description");

    expect(repository.getLocale).toHaveBeenCalledTimes(1);
    expect(translateMock).toHaveBeenCalledWith(
      "ping.description",
      expect.objectContaining({ lng: "en" }),
    );
  });

  it("falls back to default locale when guild locale is unsupported or guildId is undefined", async () => {
    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const manager = new LocaleManager("ja");
    const repository = {
      getLocale: vi.fn().mockResolvedValue("fr"),
    };
    manager.setRepository(repository as never);

    await expect(
      manager.translate("guild-2", "ping.description" as never, { value: 1 }),
    ).resolves.toBe("ja:ping.description");
    await expect(
      manager.translate(undefined, "afk.description" as never),
    ).resolves.toBe("ja:afk.description");

    expect(translateMock).toHaveBeenCalledWith(
      "ping.description",
      expect.objectContaining({ lng: "ja", value: 1 }),
    );
  });

  it("uses default locale from cache path when repository is not set", async () => {
    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const manager = new LocaleManager("ja");

    await expect(
      manager.translate("guild-no-repo", "ping.description" as never),
    ).resolves.toBe("ja:ping.description");
  });

  it("returns key and logs error when translation fails", async () => {
    translateMock.mockImplementation(() => {
      throw new Error("translation-failed");
    });

    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const manager = new LocaleManager("ja");

    await expect(
      manager.translate("guild-3", "vac.description" as never),
    ).resolves.toBe("vac.description");
    expect(loggerMock.error).toHaveBeenCalledWith(
      "Translation failed for key: vac.description",
      expect.any(Error),
    );
  });

  it("gets fixed translators, invalidates cache, and exposes locale metadata", async () => {
    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const { SUPPORTED_LOCALES } = await import("@/shared/locale/i18n");
    const manager = new LocaleManager("ja");
    const repository = {
      getLocale: vi.fn().mockResolvedValue("en"),
    };
    manager.setRepository(repository as never);

    const guildTranslator = await manager.getGuildT("guild-4");
    expect(typeof guildTranslator).toBe("function");
    expect(getFixedTMock).toHaveBeenCalledWith("en");

    manager.invalidateLocaleCache("guild-4");
    await manager.getGuildT("guild-4");
    expect(repository.getLocale).toHaveBeenCalledTimes(2);

    manager.getFixedT("ja");
    expect(getFixedTMock).toHaveBeenCalledWith("ja");
    expect(manager.getDefaultLocale()).toBe("ja");
    expect(manager.getSupportedLocales()).toBe(SUPPORTED_LOCALES);
    expect(manager.isSupported("ja")).toBe(true);
    expect(manager.isSupported("xx")).toBe(false);
  });

  it("getGuildT uses default locale when guildId is undefined", async () => {
    const { LocaleManager } = await import("@/shared/locale/localeManager");
    const manager = new LocaleManager("ja");
    const repository = {
      getLocale: vi.fn().mockResolvedValue("en"),
    };
    manager.setRepository(repository as never);

    const translator = await manager.getGuildT(undefined);

    expect(typeof translator).toBe("function");
    expect(getFixedTMock).toHaveBeenCalledWith("ja");
    expect(repository.getLocale).not.toHaveBeenCalled();
  });

  it("tGuild and tDefault delegate to singleton manager/i18next", async () => {
    const module = await import("@/shared/locale/localeManager");

    const translateSpy = vi
      .spyOn(module.localeManager, "translate")
      .mockResolvedValue("guild-result");

    await expect(
      module.tGuild("guild-5", "ping.description" as never),
    ).resolves.toBe("guild-result");
    expect(translateSpy).toHaveBeenCalledWith(
      "guild-5",
      "ping.description",
      undefined,
    );

    const defaultText = module.tDefault("afk.description" as never, {
      value: 2,
    });
    expect(defaultText).toBe("ja:afk.description");
    expect(translateMock).toHaveBeenCalledWith(
      "afk.description",
      expect.objectContaining({ lng: "ja", value: 2 }),
    );
  });
});
