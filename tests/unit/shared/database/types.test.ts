// tests/unit/shared/database/types.test.ts
describe("shared/database/types", () => {
  it("loads module", async () => {
    const module = await import("@/shared/database/types");
    expect(module).toBeDefined();
  });
});
