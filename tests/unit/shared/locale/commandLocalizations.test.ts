// tests/unit/shared/locale/commandLocalizations.test.ts
import {
  getCommandLocalizations,
  withLocalization,
} from "@/shared/locale/commandLocalizations";
import { resources } from "@/shared/locale/locales/resources";

describe("shared/locale/commandLocalizations", () => {
  it("returns ja default and English localization map", () => {
    const key = "ping.description";
    const localizations = getCommandLocalizations(key);

    expect(localizations.ja).toBe(resources.ja.commands[key]);
    expect(localizations.localizations).toEqual({
      "en-US": resources.en.commands[key],
      "en-GB": resources.en.commands[key],
    });
  });

  it("creates helper object and applies localization to builder chain", () => {
    const key = "afk.description";
    const calls: Array<{ method: string; value: unknown }> = [];

    const builder = {
      setDescription(description: string) {
        calls.push({ method: "setDescription", value: description });
        return this;
      },
      setDescriptionLocalizations(localizations: Record<string, string>) {
        calls.push({
          method: "setDescriptionLocalizations",
          value: localizations,
        });
        return this;
      },
    };

    const localized = withLocalization(key);
    const result = localized.apply(builder);

    expect(localized.description).toBe(resources.ja.commands[key]);
    expect(localized.descriptionLocalizations).toEqual({
      "en-US": resources.en.commands[key],
      "en-GB": resources.en.commands[key],
    });
    expect(result).toBe(builder);
    expect(calls).toEqual([
      { method: "setDescription", value: resources.ja.commands[key] },
      {
        method: "setDescriptionLocalizations",
        value: {
          "en-US": resources.en.commands[key],
          "en-GB": resources.en.commands[key],
        },
      },
    ]);
  });
});
