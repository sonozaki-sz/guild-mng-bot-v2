// tests/unit/bot/features/vac/repositories/index.test.ts
describe("bot/features/vac/repositories/vacRepository", () => {
  it("exports vac repository functions", async () => {
    const repositoryModule =
      await import("@/bot/features/vac/repositories/vacRepository");

    expect(repositoryModule.createVacRepository).toEqual(expect.any(Function));
    expect(repositoryModule.getVacRepository).toEqual(expect.any(Function));
  });
});
