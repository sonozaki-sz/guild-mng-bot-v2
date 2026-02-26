// tests/unit/shared/locale/locales/en/common.test.ts
describe("shared/locale/locales/en/common", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/en/common");
    expect(module).toBeDefined();
  });
});
