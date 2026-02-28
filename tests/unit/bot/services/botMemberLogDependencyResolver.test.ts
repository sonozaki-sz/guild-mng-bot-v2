// tests/unit/bot/services/botMemberLogDependencyResolver.test.ts
describe("bot/services/botMemberLogDependencyResolver", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("stores and returns member-log config service", async () => {
    const module =
      await import("@/bot/services/botMemberLogDependencyResolver");

    const configService = { id: "config" } as never;
    module.setBotMemberLogConfigService(configService);

    expect(module.getBotMemberLogConfigService()).toBe(configService);
  });

  it("throws when config service is not initialized", async () => {
    const module =
      await import("@/bot/services/botMemberLogDependencyResolver");

    expect(() => module.getBotMemberLogConfigService()).toThrow(
      "MemberLogConfigService is not initialized",
    );
  });
});
