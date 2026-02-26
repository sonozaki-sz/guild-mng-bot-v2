// tests/unit/shared/config/index.test.ts
describe("shared/config/env", () => {
  it("loads env module", async () => {
    const module = await import("@/shared/config/env");
    expect(module.env).toBeDefined();
  });
});
