// tests/unit/shared/locale/locales/ja/common.test.ts
describe("shared/locale/locales/ja/common", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/ja/common");
    expect(module).toBeDefined();
  });
});
