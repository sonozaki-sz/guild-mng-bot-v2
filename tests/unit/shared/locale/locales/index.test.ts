// tests/unit/shared/locale/locales/index.test.ts
describe("shared/locale/locales/index", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/resources");
    expect(module).toBeDefined();
  });
});
