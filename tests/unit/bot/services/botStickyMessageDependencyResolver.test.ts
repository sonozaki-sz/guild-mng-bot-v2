// tests/unit/bot/services/botStickyMessageDependencyResolver.test.ts

describe("bot/services/botStickyMessageDependencyResolver", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("stores and returns sticky message dependencies", async () => {
    const module =
      await import("@/bot/services/botStickyMessageDependencyResolver");

    const configService = { id: "config" } as never;
    const resendService = { id: "resend" } as never;

    module.setBotStickyMessageConfigService(configService);
    module.setBotStickyMessageResendService(resendService);

    expect(module.getBotStickyMessageConfigService()).toBe(configService);
    expect(module.getBotStickyMessageResendService()).toBe(resendService);
  });

  it("throws when dependencies are not initialized", async () => {
    const module =
      await import("@/bot/services/botStickyMessageDependencyResolver");

    expect(() => module.getBotStickyMessageConfigService()).toThrow(
      "StickyMessageConfigService is not initialized",
    );
    expect(() => module.getBotStickyMessageResendService()).toThrow(
      "StickyMessageResendService is not initialized",
    );
  });
});
