// tests/unit/bot/features/vac/index.test.ts
describe("bot/features/vac modules", () => {
  it("exports vac repository APIs from direct module", async () => {
    const repositoriesModule = await import(
      "@/bot/features/vac/repositories/vacRepository"
    );

    expect(repositoriesModule.createVacRepository).toEqual(
      expect.any(Function),
    );
    expect(repositoriesModule.getVacRepository).toEqual(expect.any(Function));
  });
});
