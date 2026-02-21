describe("bot/services/botVacDependencyResolver", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("stores and returns vac repository and service", async () => {
    const module = await import("@/bot/services/botVacDependencyResolver");
    const repository = { id: "repo" } as never;
    const service = { id: "service" } as never;

    module.setBotVacRepository(repository);
    module.setBotVacService(service);

    expect(module.getBotVacRepository()).toBe(repository);
    expect(module.getBotVacService()).toBe(service);
  });

  it("throws when vac dependencies are not initialized", async () => {
    const module = await import("@/bot/services/botVacDependencyResolver");

    expect(() => module.getBotVacRepository()).toThrow(
      "VacRepository is not initialized",
    );
    expect(() => module.getBotVacService()).toThrow(
      "VacService is not initialized",
    );
  });
});
