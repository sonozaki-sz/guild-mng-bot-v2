// tests/unit/shared/locale/locales/ja/commands.test.ts
describe("shared/locale/locales/ja/commands", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/ja/commands");
    expect(module).toBeDefined();
  });
});
