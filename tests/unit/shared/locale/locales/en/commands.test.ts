// tests/unit/shared/locale/locales/en/commands.test.ts
describe("shared/locale/locales/en/commands", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/en/commands");
    expect(module).toBeDefined();
  });
});
