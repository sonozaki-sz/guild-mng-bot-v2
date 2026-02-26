// tests/unit/shared/errors/index.test.ts
describe("shared/errors/index", () => {
  it("loads direct error modules", async () => {
    const customErrors = await import("@/shared/errors/customErrors");
    const errorHandler = await import("@/shared/errors/errorHandler");
    const errorUtils = await import("@/shared/errors/errorUtils");

    expect(customErrors).toBeDefined();
    expect(errorHandler).toBeDefined();
    expect(errorUtils).toBeDefined();
  });
});
