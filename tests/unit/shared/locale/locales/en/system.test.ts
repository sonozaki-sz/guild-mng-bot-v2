// tests/unit/shared/locale/locales/en/system.test.ts
describe("shared/locale/locales/en/system", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/en/system");
    expect(module).toBeDefined();
  });
});
