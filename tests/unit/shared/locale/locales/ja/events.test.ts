// tests/unit/shared/locale/locales/ja/events.test.ts
describe("shared/locale/locales/ja/events", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/ja/events");
    expect(module).toBeDefined();
  });
});
