// tests/unit/shared/locale/index.test.ts
describe("shared/locale modules", () => {
  it("exports locale related values from direct modules", async () => {
    const commandLocalizationsModule = await import(
      "@/shared/locale/commandLocalizations"
    );
    const i18nModule = await import("@/shared/locale/i18n");
    const localeManagerModule = await import("@/shared/locale/localeManager");
    const helpersModule = await import("@/shared/locale/helpers");
    const localesModule = await import("@/shared/locale/locales/resources");

    expect(commandLocalizationsModule.getCommandLocalizations).toEqual(
      expect.any(Function),
    );
    expect(i18nModule.DEFAULT_LOCALE).toBeDefined();
    expect(i18nModule.SUPPORTED_LOCALES).toBeDefined();
    expect(localeManagerModule.LocaleManager).toEqual(expect.any(Function));
    expect(localeManagerModule.localeManager).toBeDefined();
    expect(localeManagerModule.tDefault).toEqual(expect.any(Function));
    expect(localeManagerModule.tGuild).toEqual(expect.any(Function));
    expect(helpersModule.getGuildTranslator).toEqual(expect.any(Function));
    expect(localesModule.resources).toBeDefined();
  });
});
