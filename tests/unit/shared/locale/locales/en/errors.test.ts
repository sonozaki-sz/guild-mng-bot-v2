// tests/unit/shared/locale/locales/en/errors.test.ts
describe("shared/locale/locales/en/errors", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/en/errors");
    expect(module).toBeDefined();
  });
});
