import type { VacChannelPair, VacConfig } from "@/shared/database/types";

// GuildConfigRepository の VAC 関連メソッドをテスト用にモック
const mockRepo = {
  getVacConfig: vi.fn<(guildId: string) => Promise<VacConfig | null>>(),
  updateVacConfig:
    vi.fn<(guildId: string, config: VacConfig) => Promise<void>>(),
};

vi.mock("@/shared/database/guildConfigRepositoryProvider", () => ({
  getGuildConfigRepository: () => mockRepo,
}));

import {
  DEFAULT_VAC_CONFIG,
  VacConfigService,
  addCreatedVacChannel,
  addTriggerChannel,
  createVacConfigService,
  getVacConfigOrDefault,
  getVacConfigService,
  isManagedVacChannel,
  removeCreatedVacChannel,
  removeTriggerChannel,
  saveVacConfig,
} from "@/shared/features/vac/vacConfigService";

describe("shared/features/vac/config", () => {
  // VAC設定の取得・更新・重複回避・存在判定の分岐を検証
  const guildId = "guild-1";

  // テスト間でモック状態が汚染されないように毎回リセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("re-exports all service values", async () => {
    const serviceModule =
      await import("@/shared/features/vac/vacConfigService");

    expect(DEFAULT_VAC_CONFIG).toBe(serviceModule.DEFAULT_VAC_CONFIG);
    expect(VacConfigService).toBe(serviceModule.VacConfigService);
    expect(createVacConfigService).toBe(serviceModule.createVacConfigService);
    expect(getVacConfigService).toBe(serviceModule.getVacConfigService);
    expect(getVacConfigOrDefault).toBe(serviceModule.getVacConfigOrDefault);
    expect(saveVacConfig).toBe(serviceModule.saveVacConfig);
    expect(addTriggerChannel).toBe(serviceModule.addTriggerChannel);
    expect(removeTriggerChannel).toBe(serviceModule.removeTriggerChannel);
    expect(addCreatedVacChannel).toBe(serviceModule.addCreatedVacChannel);
    expect(removeCreatedVacChannel).toBe(serviceModule.removeCreatedVacChannel);
    expect(isManagedVacChannel).toBe(serviceModule.isManagedVacChannel);
  });

  it("returns default config when VAC config is missing", async () => {
    mockRepo.getVacConfig.mockResolvedValueOnce(null);

    const result = await getVacConfigOrDefault(guildId);

    expect(result).toEqual(DEFAULT_VAC_CONFIG);
    expect(result).not.toBe(DEFAULT_VAC_CONFIG);
    expect(result.triggerChannelIds).not.toBe(
      DEFAULT_VAC_CONFIG.triggerChannelIds,
    );
    expect(result.createdChannels).not.toBe(DEFAULT_VAC_CONFIG.createdChannels);
  });

  it("returns normalized copy when VAC config exists", async () => {
    const stored: VacConfig = {
      enabled: true,
      triggerChannelIds: ["vc-trigger"],
      createdChannels: [
        { voiceChannelId: "vc-1", ownerId: "u-1", createdAt: 123456789 },
      ],
    };
    mockRepo.getVacConfig.mockResolvedValueOnce(stored);

    const result = await getVacConfigOrDefault(guildId);

    expect(result).toEqual(stored);
    expect(result).not.toBe(stored);
    expect(result.triggerChannelIds).not.toBe(stored.triggerChannelIds);
    expect(result.createdChannels).not.toBe(stored.createdChannels);
  });

  it("normalizes arrays before saving", async () => {
    const input: VacConfig = {
      enabled: true,
      triggerChannelIds: ["a", "b"],
      createdChannels: [
        { voiceChannelId: "vc-2", ownerId: "u-2", createdAt: 10 },
      ],
    };

    await saveVacConfig(guildId, input);

    expect(mockRepo.updateVacConfig).toHaveBeenCalledTimes(1);
    const [, saved] = mockRepo.updateVacConfig.mock.calls[0];
    expect(saved).toEqual(input);
    expect(saved).not.toBe(input);
    expect(saved.triggerChannelIds).not.toBe(input.triggerChannelIds);
    expect(saved.createdChannels).not.toBe(input.createdChannels);
  });

  it("addTriggerChannel adds missing channel and enables config", async () => {
    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: false,
      triggerChannelIds: [],
      createdChannels: [],
    });

    const result = await addTriggerChannel(guildId, "trigger-1");

    expect(result.enabled).toBe(true);
    expect(result.triggerChannelIds).toEqual(["trigger-1"]);
    expect(mockRepo.updateVacConfig).toHaveBeenCalledTimes(1);
  });

  it("addTriggerChannel does not save when already enabled with existing channel", async () => {
    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    });

    const result = await addTriggerChannel(guildId, "trigger-1");

    expect(result.triggerChannelIds).toEqual(["trigger-1"]);
    expect(mockRepo.updateVacConfig).not.toHaveBeenCalled();
  });

  it("removeTriggerChannel saves only when target exists", async () => {
    // 削除対象が存在するケース
    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["target", "keep"],
      createdChannels: [],
    });

    const removed = await removeTriggerChannel(guildId, "target");
    expect(removed.triggerChannelIds).toEqual(["keep"]);
    expect(mockRepo.updateVacConfig).toHaveBeenCalledTimes(1);

    // 削除対象が存在しないケース（保存は発生しない）
    vi.clearAllMocks();
    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["keep"],
      createdChannels: [],
    });

    const untouched = await removeTriggerChannel(guildId, "missing");
    expect(untouched.triggerChannelIds).toEqual(["keep"]);
    expect(mockRepo.updateVacConfig).not.toHaveBeenCalled();
  });

  it("addCreatedVacChannel saves only when channel pair is new", async () => {
    // 登録する VAC 管理チャンネル情報
    const pair: VacChannelPair = {
      voiceChannelId: "vc-3",
      ownerId: "owner-3",
      createdAt: 300,
    };

    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["t1"],
      createdChannels: [],
    });

    const added = await addCreatedVacChannel(guildId, pair);
    expect(added.createdChannels).toEqual([pair]);
    expect(mockRepo.updateVacConfig).toHaveBeenCalledTimes(1);

    // 既存チャンネル再登録時は保存が走らないことを確認
    vi.clearAllMocks();
    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["t1"],
      createdChannels: [pair],
    });

    const unchanged = await addCreatedVacChannel(guildId, pair);
    expect(unchanged.createdChannels).toEqual([pair]);
    expect(mockRepo.updateVacConfig).not.toHaveBeenCalled();
  });

  it("removeCreatedVacChannel saves only when pair exists", async () => {
    // 事前に登録済みとする VAC 管理チャンネル情報
    const pair: VacChannelPair = {
      voiceChannelId: "vc-4",
      ownerId: "owner-4",
      createdAt: 400,
    };

    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["t1"],
      createdChannels: [pair],
    });

    const removed = await removeCreatedVacChannel(guildId, "vc-4");
    expect(removed.createdChannels).toEqual([]);
    expect(mockRepo.updateVacConfig).toHaveBeenCalledTimes(1);

    // 存在しないIDを削除しても保存は発生しない
    vi.clearAllMocks();
    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["t1"],
      createdChannels: [pair],
    });

    const unchanged = await removeCreatedVacChannel(guildId, "vc-missing");
    expect(unchanged.createdChannels).toEqual([pair]);
    expect(mockRepo.updateVacConfig).not.toHaveBeenCalled();
  });

  it("isManagedVacChannel returns false when no config", async () => {
    mockRepo.getVacConfig.mockResolvedValueOnce(null);

    await expect(isManagedVacChannel(guildId, "vc-5")).resolves.toBe(false);
  });

  it("isManagedVacChannel returns true only for existing managed channel", async () => {
    // 管理下チャンネルに一致する場合
    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["t1"],
      createdChannels: [
        { voiceChannelId: "vc-6", ownerId: "owner-6", createdAt: 600 },
      ],
    });
    await expect(isManagedVacChannel(guildId, "vc-6")).resolves.toBe(true);

    // 管理下チャンネルに一致しない場合
    mockRepo.getVacConfig.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["t1"],
      createdChannels: [
        { voiceChannelId: "vc-6", ownerId: "owner-6", createdAt: 600 },
      ],
    });
    await expect(isManagedVacChannel(guildId, "vc-other")).resolves.toBe(false);
  });
});
