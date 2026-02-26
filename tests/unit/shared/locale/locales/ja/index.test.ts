// tests/unit/shared/locale/locales/ja/index.test.ts
describe("shared/locale/locales/ja/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/ja/resources");
    expect(module).toBeDefined();
  });
});
