// tests/unit/shared/features/afk/index.test.ts
describe("shared/features/afk modules", () => {
  it("exports afk config service values from direct module", async () => {
    const serviceModule =
      await import("@/shared/features/afk/afkConfigService");

    expect(serviceModule.AfkConfigService).toEqual(expect.any(Function));
    expect(serviceModule.DEFAULT_AFK_CONFIG).toBeDefined();
    expect(serviceModule.createAfkConfigService).toEqual(expect.any(Function));
    expect(serviceModule.getAfkConfigService).toEqual(expect.any(Function));
    expect(serviceModule.getAfkConfig).toEqual(expect.any(Function));
    expect(serviceModule.getAfkConfigOrDefault).toEqual(expect.any(Function));
    expect(serviceModule.saveAfkConfig).toEqual(expect.any(Function));
    expect(serviceModule.setAfkChannel).toEqual(expect.any(Function));
  });
});
