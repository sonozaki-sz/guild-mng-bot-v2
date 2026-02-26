// tests/unit/shared/locale/locales/ja/system.test.ts
describe("shared/locale/locales/ja/system", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/ja/system");
    expect(module).toBeDefined();
  });
});
