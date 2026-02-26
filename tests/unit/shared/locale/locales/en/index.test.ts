// tests/unit/shared/locale/locales/en/index.test.ts
describe("shared/locale/locales/en/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/en/resources");
    expect(module).toBeDefined();
  });
});
