// tests/unit/shared/features/sticky-message/stickyMessageConfigService.test.ts

function createRepoMock() {
  return {
    findByChannel: vi.fn(),
    findAllByGuild: vi.fn(),
    create: vi.fn(),
    updateLastMessageId: vi.fn(),
    updateContent: vi.fn(),
    delete: vi.fn(),
    deleteByChannel: vi.fn(),
  };
}

// StickyMessageConfigService の各メソッドがリポジトリへ正しい引数を委譲するか、
// およびシングルトン管理関数（set/get/create）のライフサイクルが正しく機能するかを検証する
describe("shared/features/sticky-message/stickyMessageConfigService", () => {
  // vi.resetModules でモジュールを再評価し、テスト間でシングルトン状態が持ち越されないようにする
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function loadModule() {
    return import("@/shared/features/sticky-message/stickyMessageConfigService");
  }

  it("findByChannel delegates to repository", async () => {
    const repo = createRepoMock();
    const expected = { id: "s1", channelId: "ch-1", content: "hello" };
    repo.findByChannel.mockResolvedValue(expected);

    const { StickyMessageConfigService } = await loadModule();
    const service = new StickyMessageConfigService(repo as never);
    const result = await service.findByChannel("ch-1");

    expect(repo.findByChannel).toHaveBeenCalledWith("ch-1");
    expect(result).toBe(expected);
  });

  it("findAllByGuild delegates to repository", async () => {
    const repo = createRepoMock();
    const expected = [{ id: "s1" }, { id: "s2" }];
    repo.findAllByGuild.mockResolvedValue(expected);

    const { StickyMessageConfigService } = await loadModule();
    const service = new StickyMessageConfigService(repo as never);
    const result = await service.findAllByGuild("guild-1");

    expect(repo.findAllByGuild).toHaveBeenCalledWith("guild-1");
    expect(result).toBe(expected);
  });

  // 引数が多い create メソッドが全引数を過不足なくリポジトリに転送することを確認
  it("create delegates to repository with all args", async () => {
    const repo = createRepoMock();
    const expected = { id: "s1" };
    repo.create.mockResolvedValue(expected);

    const { StickyMessageConfigService } = await loadModule();
    const service = new StickyMessageConfigService(repo as never);
    const result = await service.create(
      "g1",
      "ch-1",
      "content",
      '{"title":"t"}',
      "user-1",
    );

    expect(repo.create).toHaveBeenCalledWith(
      "g1",
      "ch-1",
      "content",
      '{"title":"t"}',
      "user-1",
    );
    expect(result).toBe(expected);
  });

  it("updateLastMessageId delegates to repository", async () => {
    const repo = createRepoMock();
    repo.updateLastMessageId.mockResolvedValue(undefined);

    const { StickyMessageConfigService } = await loadModule();
    const service = new StickyMessageConfigService(repo as never);
    await service.updateLastMessageId("s1", "msg-id");

    expect(repo.updateLastMessageId).toHaveBeenCalledWith("s1", "msg-id");
  });

  it("updateContent delegates to repository", async () => {
    const repo = createRepoMock();
    const expected = { id: "s1", content: "new" };
    repo.updateContent.mockResolvedValue(expected);

    const { StickyMessageConfigService } = await loadModule();
    const service = new StickyMessageConfigService(repo as never);
    const result = await service.updateContent("s1", "new", null, "user-1");

    expect(repo.updateContent).toHaveBeenCalledWith(
      "s1",
      "new",
      null,
      "user-1",
    );
    expect(result).toBe(expected);
  });

  it("delete delegates to repository", async () => {
    const repo = createRepoMock();
    repo.delete.mockResolvedValue(undefined);

    const { StickyMessageConfigService } = await loadModule();
    const service = new StickyMessageConfigService(repo as never);
    await service.delete("s1");

    expect(repo.delete).toHaveBeenCalledWith("s1");
  });

  it("deleteByChannel delegates to repository", async () => {
    const repo = createRepoMock();
    repo.deleteByChannel.mockResolvedValue(undefined);

    const { StickyMessageConfigService } = await loadModule();
    const service = new StickyMessageConfigService(repo as never);
    await service.deleteByChannel("ch-1");

    expect(repo.deleteByChannel).toHaveBeenCalledWith("ch-1");
  });

  it("createStickyMessageConfigService returns new service instance", async () => {
    const repo = createRepoMock();
    const { createStickyMessageConfigService, StickyMessageConfigService } =
      await loadModule();

    const service = createStickyMessageConfigService(repo as never);
    expect(service).toBeInstanceOf(StickyMessageConfigService);
  });

  // set より前に get を呼び出した場合は例外となり、初期化前アクセスを防止していることを確認
  it("getStickyMessageConfigService throws when not initialized", async () => {
    const { getStickyMessageConfigService } = await loadModule();

    expect(() => getStickyMessageConfigService()).toThrow(
      "StickyMessageConfigService is not initialized",
    );
  });

  // set → get のライフサイクルで同一インスタンスが返ることを確認し、シングルトン登録の一貫性を検証する
  it("setStickyMessageConfigService and getStickyMessageConfigService work together", async () => {
    const repo = createRepoMock();
    const {
      createStickyMessageConfigService,
      setStickyMessageConfigService,
      getStickyMessageConfigService,
    } = await loadModule();

    const service = createStickyMessageConfigService(repo as never);
    setStickyMessageConfigService(service);

    expect(getStickyMessageConfigService()).toBe(service);
  });
});
