// tests/unit/shared/locale/locales/en/events.test.ts
describe("shared/locale/locales/en/events", () => {
  it("loads module", async () => {
    const module = await import("@/shared/locale/locales/en/events");
    expect(module).toBeDefined();
  });
});
