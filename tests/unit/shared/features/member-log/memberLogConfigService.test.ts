// tests/unit/shared/features/member-log/memberLogConfigService.test.ts
// MemberLogConfigService のデータ取得・保存・シングルトン管理を検証
describe("shared/features/member-log/memberLogConfigService", () => {
  /** テスト用 repository モックを生成する */
  const createRepositoryMock = () => ({
    getMemberLogConfig: vi.fn(),
    updateMemberLogConfig: vi.fn(),
  });

  // vi.resetModules() で ESM キャッシュを破棄し、各テストで独立したモジュールスコープを使用するためのヘルパー
  const loadModule = async () => {
    vi.resetModules();
    vi.clearAllMocks();

    const getGuildConfigRepositoryMock = vi.fn();
    vi.doMock("@/shared/database/guildConfigRepositoryProvider", () => ({
      getGuildConfigRepository: getGuildConfigRepositoryMock,
    }));

    const module =
      await import("@/shared/features/member-log/memberLogConfigService");

    return { module, getGuildConfigRepositoryMock };
  };

  // getMemberLogConfig がリポジトリの値をそのまま返すことを確認
  describe("MemberLogConfigService", () => {
    // getMemberLogConfig が repository へ委譲し、null を返せることを確認
    it("getMemberLogConfig returns null when repository has no config", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();
      const service = new module.MemberLogConfigService(repository as never);
      repository.getMemberLogConfig.mockResolvedValueOnce(null);

      const result = await service.getMemberLogConfig("guild-1");

      expect(result).toBeNull();
      expect(repository.getMemberLogConfig).toHaveBeenCalledWith("guild-1");
    });

    // getMemberLogConfig が repository の値を返すことを確認
    it("getMemberLogConfig returns config from repository", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();
      const service = new module.MemberLogConfigService(repository as never);
      const config = { enabled: true, channelId: "ch-1" };
      repository.getMemberLogConfig.mockResolvedValueOnce(config);

      const result = await service.getMemberLogConfig("guild-1");

      expect(result).toEqual(config);
    });

    // getMemberLogConfigOrDefault が null 時にデフォルト値を返すことを確認
    it("getMemberLogConfigOrDefault returns default when config is null", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();
      const service = new module.MemberLogConfigService(repository as never);
      repository.getMemberLogConfig.mockResolvedValueOnce(null);

      const result = await service.getMemberLogConfigOrDefault("guild-1");

      expect(result).toEqual({ enabled: false });
    });

    // getMemberLogConfigOrDefault が毎回新しいオブジェクトを返すことを確認（参照共有なし）
    it("getMemberLogConfigOrDefault returns a fresh object each time (not same reference)", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();
      const service = new module.MemberLogConfigService(repository as never);
      repository.getMemberLogConfig.mockResolvedValue(null);

      const first = await service.getMemberLogConfigOrDefault("guild-1");
      const second = await service.getMemberLogConfigOrDefault("guild-1");

      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });

    // setChannelId が現在の設定を読み込んで channelId をマージして保存することを確認
    it("setChannelId reads current config and saves merged result", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();
      const service = new module.MemberLogConfigService(repository as never);
      const current = { enabled: true };
      repository.getMemberLogConfig.mockResolvedValueOnce(current);
      repository.updateMemberLogConfig.mockResolvedValueOnce(undefined);

      await service.setChannelId("guild-1", "ch-new");

      expect(repository.updateMemberLogConfig).toHaveBeenCalledWith("guild-1", {
        enabled: true,
        channelId: "ch-new",
      });
    });

    // setEnabled が現在の設定を読み込んで enabled をマージして保存することを確認
    it("setEnabled reads current config and saves merged enabled flag", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();
      const service = new module.MemberLogConfigService(repository as never);
      repository.getMemberLogConfig.mockResolvedValueOnce({
        enabled: false,
        channelId: "ch-1",
      });
      repository.updateMemberLogConfig.mockResolvedValueOnce(undefined);

      await service.setEnabled("guild-1", true);

      expect(repository.updateMemberLogConfig).toHaveBeenCalledWith("guild-1", {
        enabled: true,
        channelId: "ch-1",
      });
    });

    // setJoinMessage が joinMessage をマージして保存することを確認
    it("setJoinMessage reads current config and saves with joinMessage", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();
      const service = new module.MemberLogConfigService(repository as never);
      repository.getMemberLogConfig.mockResolvedValueOnce({ enabled: true });
      repository.updateMemberLogConfig.mockResolvedValueOnce(undefined);

      await service.setJoinMessage("guild-1", "ようこそ!");

      expect(repository.updateMemberLogConfig).toHaveBeenCalledWith("guild-1", {
        enabled: true,
        joinMessage: "ようこそ!",
      });
    });

    // setLeaveMessage が leaveMessage をマージして保存することを確認
    it("setLeaveMessage reads current config and saves with leaveMessage", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();
      const service = new module.MemberLogConfigService(repository as never);
      repository.getMemberLogConfig.mockResolvedValueOnce({ enabled: true });
      repository.updateMemberLogConfig.mockResolvedValueOnce(undefined);

      await service.setLeaveMessage("guild-1", "さようなら!");

      expect(repository.updateMemberLogConfig).toHaveBeenCalledWith("guild-1", {
        enabled: true,
        leaveMessage: "さようなら!",
      });
    });
  });

  // createMemberLogConfigService が新しいインスタンスを返すことを検証
  describe("createMemberLogConfigService", () => {
    // createMemberLogConfigService が MemberLogConfigService の新しいインスタンスを生成することを確認
    it("creates and returns a new MemberLogConfigService instance", async () => {
      const { module } = await loadModule();
      const repository = createRepositoryMock();

      const service = module.createMemberLogConfigService(repository as never);

      expect(service).toBeInstanceOf(module.MemberLogConfigService);
    });
  });

  // getMemberLogConfigService のシングルトン動作を検証
  describe("getMemberLogConfigService", () => {
    // 同じ repository で 2 回呼ぶと同一インスタンスを返すことを確認
    it("returns the same singleton when called with the same repository", async () => {
      const { module, getGuildConfigRepositoryMock } = await loadModule();
      const repository = createRepositoryMock();
      getGuildConfigRepositoryMock.mockReturnValue(repository);

      const first = module.getMemberLogConfigService();
      const second = module.getMemberLogConfigService();

      expect(first).toBe(second);
    });

    // 異なる repository を渡すと新しいインスタンスを返すことを確認
    it("creates a new instance when called with a different repository", async () => {
      const { module } = await loadModule();
      const repo1 = createRepositoryMock();
      const repo2 = createRepositoryMock();

      const first = module.getMemberLogConfigService(repo1 as never);
      const second = module.getMemberLogConfigService(repo2 as never);

      expect(first).not.toBe(second);
    });

    // 引数なしで呼ぶと getGuildConfigRepository のリポジトリを使用することを確認
    it("uses getGuildConfigRepository as default when no repository is provided", async () => {
      const { module, getGuildConfigRepositoryMock } = await loadModule();
      const repository = createRepositoryMock();
      getGuildConfigRepositoryMock.mockReturnValue(repository);

      const service = module.getMemberLogConfigService();
      repository.getMemberLogConfig.mockResolvedValueOnce(null);
      await service.getMemberLogConfig("guild-1");

      expect(repository.getMemberLogConfig).toHaveBeenCalledWith("guild-1");
      expect(getGuildConfigRepositoryMock).toHaveBeenCalled();
    });
  });
});
