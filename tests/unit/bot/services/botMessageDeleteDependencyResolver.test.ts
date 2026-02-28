// tests/unit/bot/services/botMessageDeleteDependencyResolver.test.ts

describe("bot/services/botMessageDeleteDependencyResolver", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // setBotMessageDeleteUserSettingService で登録したサービスが getBotMessageDeleteUserSettingService で取得できることを検証
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

  // サービス未登録の状態で getBotMessageDeleteUserSettingService を呼ぶと Error がスローされることを検証
  it("初期化前に get すると例外を投げる", async () => {
    const module =
      await import("@/bot/services/botMessageDeleteDependencyResolver");

    expect(() => module.getBotMessageDeleteUserSettingService()).toThrow(
      "MessageDeleteUserSettingService is not initialized",
    );
  });
});
