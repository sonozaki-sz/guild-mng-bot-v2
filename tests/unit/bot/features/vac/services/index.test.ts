// tests/unit/bot/features/vac/services/index.test.ts
describe("bot/features/vac/services/vacService", () => {
  it("exports vac service APIs", async () => {
    const serviceModule =
      await import("@/bot/features/vac/services/vacService");

    expect(serviceModule.createVacService).toEqual(expect.any(Function));
    expect(serviceModule.getVacService).toEqual(expect.any(Function));
    expect(serviceModule.VacService).toEqual(expect.any(Function));
  });
});
