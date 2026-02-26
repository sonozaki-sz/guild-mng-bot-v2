// tests/unit/bot/features/vac/repositories/vacRepository.test.ts
import type { Mock } from "vitest";

const getVacConfigServiceMock: Mock = vi.fn();

vi.mock("@/shared/features/vac/vacConfigService", () => ({
  getVacConfigService: (repository?: unknown) =>
    getVacConfigServiceMock(repository),
}));

function createVacConfigServicePortMock(): {
  getVacConfigOrDefault: Mock;
  saveVacConfig: Mock;
  addTriggerChannel: Mock;
  removeTriggerChannel: Mock;
  addCreatedVacChannel: Mock;
  removeCreatedVacChannel: Mock;
  isManagedVacChannel: Mock;
} {
  return {
    getVacConfigOrDefault: vi.fn(),
    saveVacConfig: vi.fn(),
    addTriggerChannel: vi.fn(),
    removeTriggerChannel: vi.fn(),
    addCreatedVacChannel: vi.fn(),
    removeCreatedVacChannel: vi.fn(),
    isManagedVacChannel: vi.fn(),
  };
}

function createRepositoryMock(): {
  getVacConfigOrDefault: Mock;
  saveVacConfig: Mock;
  addTriggerChannel: Mock;
  removeTriggerChannel: Mock;
  addCreatedVacChannel: Mock;
  removeCreatedVacChannel: Mock;
  isManagedVacChannel: Mock;
} {
  return {
    getVacConfigOrDefault: vi.fn(),
    saveVacConfig: vi.fn(),
    addTriggerChannel: vi.fn(),
    removeTriggerChannel: vi.fn(),
    addCreatedVacChannel: vi.fn(),
    removeCreatedVacChannel: vi.fn(),
    isManagedVacChannel: vi.fn(),
  };
}

// リポジトリ層がデータ操作を全て VacConfigService に委譲するデレゲーション構造と
// インスタンスキャッシュの蓋え替え・内部シングルトン管理を検証するテスト群
describe("bot/features/vac/repositories/vacRepository", () => {
  // vi.doMock を用いた動的インポートのため、各テスト前にモジュールキャッシュをリセットして
  // 前のテストケースで設定されたテープル状態が次のテストに漏れア出ないようにする
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // 7つの操作すべてが第一引数のサービスインスタンスにそのまま委譲され、guildId/引数が正しく渡ることを一括検証
  it("delegates all repository operations to injected vac config service", async () => {
    const vacConfigService = createVacConfigServicePortMock();
    const expectedConfig = {
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    };

    vacConfigService.getVacConfigOrDefault.mockResolvedValue(expectedConfig);
    vacConfigService.saveVacConfig.mockResolvedValue(undefined);
    vacConfigService.addTriggerChannel.mockResolvedValue(expectedConfig);
    vacConfigService.removeTriggerChannel.mockResolvedValue(expectedConfig);
    vacConfigService.addCreatedVacChannel.mockResolvedValue(expectedConfig);
    vacConfigService.removeCreatedVacChannel.mockResolvedValue(expectedConfig);
    vacConfigService.isManagedVacChannel.mockResolvedValue(true);

    const { createVacRepository } =
      await import("@/bot/features/vac/repositories/vacRepository");
    const repository = createVacRepository(vacConfigService as never);

    const channelPair = {
      voiceChannelId: "voice-1",
      ownerId: "user-1",
      createdAt: 1,
    };
    await expect(repository.getVacConfigOrDefault("guild-1")).resolves.toBe(
      expectedConfig,
    );
    await expect(
      repository.saveVacConfig("guild-1", expectedConfig),
    ).resolves.toBeUndefined();
    await expect(
      repository.addTriggerChannel("guild-1", "trigger-1"),
    ).resolves.toBe(expectedConfig);
    await expect(
      repository.removeTriggerChannel("guild-1", "trigger-1"),
    ).resolves.toBe(expectedConfig);
    await expect(
      repository.addCreatedVacChannel("guild-1", channelPair),
    ).resolves.toBe(expectedConfig);
    await expect(
      repository.removeCreatedVacChannel("guild-1", "voice-1"),
    ).resolves.toBe(expectedConfig);
    await expect(
      repository.isManagedVacChannel("guild-1", "voice-1"),
    ).resolves.toBe(true);

    expect(vacConfigService.getVacConfigOrDefault).toHaveBeenCalledWith(
      "guild-1",
    );
    expect(vacConfigService.saveVacConfig).toHaveBeenCalledWith(
      "guild-1",
      expectedConfig,
    );
    expect(vacConfigService.addTriggerChannel).toHaveBeenCalledWith(
      "guild-1",
      "trigger-1",
    );
    expect(vacConfigService.removeTriggerChannel).toHaveBeenCalledWith(
      "guild-1",
      "trigger-1",
    );
    expect(vacConfigService.addCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      channelPair,
    );
    expect(vacConfigService.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "voice-1",
    );
    expect(vacConfigService.isManagedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "voice-1",
    );
  });

  it("returns injected repository and reuses it on subsequent no-arg call", async () => {
    const { getVacRepository } =
      await import("@/bot/features/vac/repositories/vacRepository");

    const injectedRepository = createRepositoryMock();
    const resolved = getVacRepository(injectedRepository as never);
    const reused = getVacRepository();

    expect(resolved).toBe(injectedRepository);
    expect(reused).toBe(injectedRepository);
    expect(getVacConfigServiceMock).not.toHaveBeenCalled();
  });

  // 引数なしで 2 回呼んでも getVacConfigService は 1 回しか呼ばれず
  // 内部ライブラリ実装がレイジーシングルトンであることを検証
  it("creates default repository once from getVacConfigService", async () => {
    const vacConfigService = createVacConfigServicePortMock();
    getVacConfigServiceMock.mockReturnValue(vacConfigService);

    const { getVacRepository } =
      await import("@/bot/features/vac/repositories/vacRepository");

    const repository1 = getVacRepository();
    const repository2 = getVacRepository();

    expect(repository1).toBe(repository2);
    expect(getVacConfigServiceMock).toHaveBeenCalledTimes(1);
  });

  // 外部からリポジトリを注入するとデフォルトキャッシュが上書きされ、以降の呼び出しでも注入内容が使われることを検証
  it("replaces cached default repository when injected repository is provided", async () => {
    const vacConfigService = createVacConfigServicePortMock();
    getVacConfigServiceMock.mockReturnValue(vacConfigService);

    const { getVacRepository } =
      await import("@/bot/features/vac/repositories/vacRepository");

    const defaultRepository = getVacRepository();
    const injectedRepository = createRepositoryMock();
    const replaced = getVacRepository(injectedRepository as never);
    const reusedInjected = getVacRepository();

    expect(replaced).toBe(injectedRepository);
    expect(reusedInjected).toBe(injectedRepository);
    expect(defaultRepository).not.toBe(injectedRepository);
  });
});
