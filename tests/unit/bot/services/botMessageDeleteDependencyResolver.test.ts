// tests/unit/bot/services/botMessageDeleteDependencyResolver.test.ts

describe("bot/services/botMessageDeleteDependencyResolver", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("set したサービスを get で取得できる", async () => {
    const module =
      await import("@/bot/services/botMessageDeleteDependencyResolver");
    const service = {
      getUserSetting: vi.fn(),
      updateUserSetting: vi.fn(),
    } as never;

    module.setBotMessageDeleteUserSettingService(service);

    expect(module.getBotMessageDeleteUserSettingService()).toBe(service);
  });

  it("初期化前に get すると例外を投げる", async () => {
    const module =
      await import("@/bot/services/botMessageDeleteDependencyResolver");

    expect(() => module.getBotMessageDeleteUserSettingService()).toThrow(
      "MessageDeleteUserSettingService is not initialized",
    );
  });
});
