import { ChannelType } from "discord.js";
import { channelDeleteEvent } from "../../../../src/bot/events/channelDelete";
import { logger } from "../../../../src/shared/utils/logger";

const getVacConfigOrDefaultMock = jest.fn();
const removeTriggerChannelMock = jest.fn();
const removeCreatedVacChannelMock = jest.fn();

// VAC設定と同期処理は呼び出し確認に限定してモック化する
jest.mock("../../../../src/shared/features/vac", () => ({
  getVacConfigOrDefault: (...args: unknown[]) =>
    getVacConfigOrDefaultMock(...args),
  removeTriggerChannel: (...args: unknown[]) =>
    removeTriggerChannelMock(...args),
  removeCreatedVacChannel: (...args: unknown[]) =>
    removeCreatedVacChannelMock(...args),
}));

// ログ・i18n は副作用抑止のためダミーにする
jest.mock("../../../../src/shared/locale", () => ({
  tDefault: jest.fn((key: string) => key),
}));
jest.mock("../../../../src/shared/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

type ChannelLike = {
  guildId: string;
  id: string;
  type: ChannelType;
  isDMBased: () => boolean;
};

// channelDelete イベント検証に必要な最小チャンネルモック
function createChannel(overrides?: Partial<ChannelLike>): ChannelLike {
  return {
    guildId: "guild-1",
    id: "channel-1",
    type: ChannelType.GuildVoice,
    isDMBased: () => false,
    ...overrides,
  };
}

describe("bot/events/channelDelete", () => {
  // 各ケース前にモック履歴を初期化する
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // DM チャンネルは同期処理の対象外であることを検証
  it("ignores DM based channel", async () => {
    const channel = createChannel({ isDMBased: () => true });

    await channelDeleteEvent.execute(channel as never);

    expect(getVacConfigOrDefaultMock).not.toHaveBeenCalled();
  });

  // ボイスチャンネル以外は VAC 同期処理しないことを検証
  it("ignores non-voice channel", async () => {
    const channel = createChannel({ type: ChannelType.GuildText });

    await channelDeleteEvent.execute(channel as never);

    expect(getVacConfigOrDefaultMock).not.toHaveBeenCalled();
  });

  // トリガー・管理対象の両方に該当する場合は両方を同期することを検証
  it("removes trigger and managed entries when deleted voice channel is tracked", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["channel-1"],
      createdChannels: [
        { voiceChannelId: "channel-1", ownerId: "owner-1", createdAt: 1 },
      ],
    });
    const channel = createChannel();

    await channelDeleteEvent.execute(channel as never);

    expect(removeTriggerChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "channel-1",
    );
    expect(removeCreatedVacChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "channel-1",
    );
  });

  // 同期処理中に例外が発生した場合はエラーログを出して終了することを検証
  it("logs error when channel delete sync throws", async () => {
    const syncError = new Error("sync failed");
    getVacConfigOrDefaultMock.mockRejectedValue(syncError);
    const channel = createChannel();

    await channelDeleteEvent.execute(channel as never);

    expect(logger.error).toHaveBeenCalledWith(
      "system:vac.channel_delete_sync_failed",
      syncError,
    );
  });

  // トリガー/管理対象のどちらにも該当しない場合は同期削除しないことを検証
  it("does nothing when deleted voice channel is not tracked", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["other-trigger"],
      createdChannels: [
        { voiceChannelId: "other-managed", ownerId: "owner-1", createdAt: 1 },
      ],
    });
    const channel = createChannel({ id: "channel-untracked" });

    await channelDeleteEvent.execute(channel as never);

    expect(removeTriggerChannelMock).not.toHaveBeenCalled();
    expect(removeCreatedVacChannelMock).not.toHaveBeenCalled();
  });
});
