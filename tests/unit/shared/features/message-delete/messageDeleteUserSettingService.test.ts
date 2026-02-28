// tests/unit/shared/features/message-delete/messageDeleteUserSettingService.test.ts

describe("shared/features/message-delete/messageDeleteUserSettingService", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const makeSetting = (skip = false) => ({
    userId: "u1",
    guildId: "g1",
    skipConfirm: skip,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const makeRepository = () => ({
    findByUserAndGuild: vi.fn(),
    upsert: vi.fn(),
  });

  async function loadModule() {
    return import("@/shared/features/message-delete/messageDeleteUserSettingService");
  }

  // ---- MessageDeleteUserSettingService ----

  describe("MessageDeleteUserSettingService", () => {
    it("getUserSetting: DB に設定が存在する場合はその値を返す", async () => {
      const { MessageDeleteUserSettingService } = await loadModule();
      const repo = makeRepository();
      const setting = makeSetting(true);
      repo.findByUserAndGuild.mockResolvedValue(setting);

      const service = new MessageDeleteUserSettingService(repo as never);
      const result = await service.getUserSetting("u1", "g1");

      expect(result).toEqual({ skipConfirm: true });
    });

    it("getUserSetting: DB に設定がない場合はデフォルト値 (skipConfirm: false) を返す", async () => {
      const { MessageDeleteUserSettingService } = await loadModule();
      const repo = makeRepository();
      repo.findByUserAndGuild.mockResolvedValue(null);

      const service = new MessageDeleteUserSettingService(repo as never);
      const result = await service.getUserSetting("u1", "g1");

      expect(result).toEqual({ skipConfirm: false });
    });

    it("updateUserSetting: repository.upsert を呼んで結果を返す", async () => {
      const { MessageDeleteUserSettingService } = await loadModule();
      const repo = makeRepository();
      const updated = makeSetting(true);
      repo.upsert.mockResolvedValue(updated);

      const service = new MessageDeleteUserSettingService(repo as never);
      const result = await service.updateUserSetting("u1", "g1", {
        skipConfirm: true,
      });

      expect(repo.upsert).toHaveBeenCalledWith("u1", "g1", {
        skipConfirm: true,
      });
      expect(result).toBe(updated);
    });
  });

  // ---- シングルトン管理関数 ----

  describe("createMessageDeleteUserSettingService", () => {
    it("サービスを生成しシングルトンキャッシュに登録する", async () => {
      const {
        createMessageDeleteUserSettingService,
        getMessageDeleteUserSettingService,
      } = await loadModule();
      const repo = makeRepository();

      const service = createMessageDeleteUserSettingService(repo as never);

      expect(getMessageDeleteUserSettingService()).toBe(service);
    });
  });

  describe("setMessageDeleteUserSettingService / getMessageDeleteUserSettingService", () => {
    it("set したサービスを get で取得できる", async () => {
      const {
        setMessageDeleteUserSettingService,
        getMessageDeleteUserSettingService,
        MessageDeleteUserSettingService,
      } = await loadModule();
      const repo = makeRepository();
      const service = new MessageDeleteUserSettingService(repo as never);

      setMessageDeleteUserSettingService(service);

      expect(getMessageDeleteUserSettingService()).toBe(service);
    });

    it("未登録の場合は undefined を返す", async () => {
      const { getMessageDeleteUserSettingService } = await loadModule();

      expect(getMessageDeleteUserSettingService()).toBeUndefined();
    });
  });
});
