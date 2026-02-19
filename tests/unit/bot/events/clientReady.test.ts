import { ActivityType, ChannelType, PresenceUpdateStatus } from "discord.js";
import { clientReadyEvent } from "../../../../src/bot/events/clientReady";

const getBumpReminderConfigServiceMock = jest.fn();
const getBumpReminderManagerMock = jest.fn();
const sendBumpReminderMock = jest.fn();
const getVacConfigOrDefaultMock = jest.fn();
const removeCreatedVacChannelMock = jest.fn();
const removeTriggerChannelMock = jest.fn();
const loggerInfoMock = jest.fn();
const loggerErrorMock = jest.fn();

// 起動時処理の外部依存をモックしてイベント本体分岐を検証する
jest.mock("../../../../src/shared/features/bump-reminder", () => ({
  getBumpReminderConfigService: () => getBumpReminderConfigServiceMock(),
}));
jest.mock("../../../../src/bot/features/bump-reminder", () => ({
  getBumpReminderManager: () => getBumpReminderManagerMock(),
}));
jest.mock(
  "../../../../src/bot/features/bump-reminder/bumpReminderHandler",
  () => ({
    sendBumpReminder: (...args: unknown[]) => sendBumpReminderMock(...args),
  }),
);
jest.mock("../../../../src/shared/features/vac", () => ({
  getVacConfigOrDefault: (...args: unknown[]) =>
    getVacConfigOrDefaultMock(...args),
  removeCreatedVacChannel: (...args: unknown[]) =>
    removeCreatedVacChannelMock(...args),
  removeTriggerChannel: (...args: unknown[]) =>
    removeTriggerChannelMock(...args),
}));
jest.mock("../../../../src/shared/locale", () => ({
  tDefault: jest.fn((key: string) => key),
}));
jest.mock("../../../../src/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

type GuildLike = {
  id: string;
  channels: {
    fetch: jest.Mock;
  };
};

type ClientLike = {
  user: {
    tag: string;
    setPresence: jest.Mock;
  };
  guilds: {
    cache: Map<string, GuildLike>;
  };
  users: {
    cache: { size: number };
  };
  commands: { size: number };
};

// clientReady イベント検証用の最小クライアントモック
function createClient(guild: GuildLike): ClientLike {
  return {
    user: {
      tag: "bot#0001",
      setPresence: jest.fn(),
    },
    guilds: {
      cache: new Map([[guild.id, guild]]),
    },
    users: {
      cache: { size: 10 },
    },
    commands: { size: 7 },
  };
}

describe("bot/events/clientReady", () => {
  // ケースごとにモック状態を初期化する
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Presence 設定と bump リマインダー復元が実行されることを検証
  it("sets presence and restores bump reminders", async () => {
    const restorePendingReminders = jest.fn().mockResolvedValue(undefined);
    const repository = { id: "repo" };
    getBumpReminderConfigServiceMock.mockReturnValue(repository);
    getBumpReminderManagerMock.mockReturnValue({ restorePendingReminders });
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [],
    });

    const guild: GuildLike = {
      id: "guild-1",
      channels: {
        fetch: jest.fn().mockResolvedValue(null),
      },
    };
    const client = createClient(guild);

    await clientReadyEvent.execute(client as never);

    expect(client.user.setPresence).toHaveBeenCalledWith({
      activities: [
        {
          name: "system:bot.presence_activity",
          type: ActivityType.Playing,
        },
      ],
      status: PresenceUpdateStatus.Online,
    });
    expect(restorePendingReminders).toHaveBeenCalledTimes(1);

    const taskFactory = restorePendingReminders.mock.calls[0][0] as (
      guildId: string,
      channelId: string,
      messageId?: string,
      panelMessageId?: string,
      serviceName?: string,
    ) => () => Promise<void>;

    const task = taskFactory(
      "guild-1",
      "channel-1",
      "message-1",
      "panel-1",
      "Disboard",
    );
    await task();

    expect(sendBumpReminderMock).toHaveBeenCalledWith(
      client,
      "guild-1",
      "channel-1",
      "message-1",
      "Disboard",
      repository,
      "panel-1",
    );
  });

  // 起動時VACクリーンアップで無効チャンネルを設定から除去することを検証
  it("cleans up invalid trigger and created channels on startup", async () => {
    getBumpReminderConfigServiceMock.mockReturnValue({});
    getBumpReminderManagerMock.mockReturnValue({
      restorePendingReminders: jest.fn().mockResolvedValue(undefined),
    });

    const emptyVoiceChannel = {
      id: "created-empty",
      type: ChannelType.GuildVoice,
      isDMBased: () => false,
      members: { size: 0 },
      delete: jest.fn().mockResolvedValue(undefined),
    };

    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["missing-trigger"],
      createdChannels: [
        { voiceChannelId: "created-missing", ownerId: "u1", createdAt: 1 },
        { voiceChannelId: "created-empty", ownerId: "u2", createdAt: 2 },
      ],
    });

    const guild: GuildLike = {
      id: "guild-1",
      channels: {
        fetch: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(emptyVoiceChannel),
      },
    };
    const client = createClient(guild);

    await clientReadyEvent.execute(client as never);

    expect(removeTriggerChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "missing-trigger",
    );
    expect(removeCreatedVacChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "created-missing",
    );
    expect(emptyVoiceChannel.delete).toHaveBeenCalledTimes(1);
    expect(removeCreatedVacChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "created-empty",
    );
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  // bumpリマインダー復元時の例外をログ出力して継続することを検証
  it("logs restore error when bump reminder restore fails", async () => {
    getBumpReminderConfigServiceMock.mockReturnValue({});
    const restoreError = new Error("restore failed");
    getBumpReminderManagerMock.mockReturnValue({
      restorePendingReminders: jest.fn().mockRejectedValue(restoreError),
    });
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [],
    });

    const guild: GuildLike = {
      id: "guild-1",
      channels: {
        fetch: jest.fn().mockResolvedValue(null),
      },
    };
    const client = createClient(guild);

    await clientReadyEvent.execute(client as never);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "system:scheduler.bump_reminder_restore_failed",
      restoreError,
    );
  });

  // VAC cleanup で fetch reject / 非Voiceチャンネル分岐を処理できることを検証
  it("handles rejected fetch and non-voice created channels on startup cleanup", async () => {
    getBumpReminderConfigServiceMock.mockReturnValue({});
    getBumpReminderManagerMock.mockReturnValue({
      restorePendingReminders: jest.fn().mockResolvedValue(undefined),
    });
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-reject"],
      createdChannels: [
        { voiceChannelId: "created-reject", ownerId: "u1", createdAt: 1 },
        { voiceChannelId: "created-text", ownerId: "u2", createdAt: 2 },
      ],
    });

    const nonVoiceChannel = {
      id: "created-text",
      type: ChannelType.GuildText,
      isDMBased: () => false,
      members: { size: 0 },
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const guild: GuildLike = {
      id: "guild-1",
      channels: {
        fetch: jest
          .fn()
          .mockRejectedValueOnce(new Error("trigger fetch failed"))
          .mockRejectedValueOnce(new Error("created fetch failed"))
          .mockResolvedValueOnce(nonVoiceChannel),
      },
    };
    const client = createClient(guild);

    await clientReadyEvent.execute(client as never);

    expect(removeTriggerChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "trigger-reject",
    );
    expect(removeCreatedVacChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "created-reject",
    );
    expect(removeCreatedVacChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "created-text",
    );
    expect(loggerErrorMock).not.toHaveBeenCalledWith(
      "system:vac.startup_cleanup_failed",
      expect.anything(),
    );
  });

  // 有効Voiceチャンネルは保持し、空Voiceのdelete失敗でもクリーンアップ継続することを検証
  it("keeps valid voice channels and continues cleanup when delete fails", async () => {
    getBumpReminderConfigServiceMock.mockReturnValue({});
    getBumpReminderManagerMock.mockReturnValue({
      restorePendingReminders: jest.fn().mockResolvedValue(undefined),
    });
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-voice"],
      createdChannels: [
        { voiceChannelId: "created-occupied", ownerId: "u1", createdAt: 1 },
        { voiceChannelId: "created-empty", ownerId: "u2", createdAt: 2 },
      ],
    });

    const triggerVoiceChannel = {
      id: "trigger-voice",
      type: ChannelType.GuildVoice,
    };
    const occupiedVoiceChannel = {
      id: "created-occupied",
      type: ChannelType.GuildVoice,
      isDMBased: () => false,
      members: { size: 2 },
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const emptyVoiceChannel = {
      id: "created-empty",
      type: ChannelType.GuildVoice,
      isDMBased: () => false,
      members: { size: 0 },
      delete: jest.fn().mockRejectedValue(new Error("delete failed")),
    };

    const guild: GuildLike = {
      id: "guild-1",
      channels: {
        fetch: jest
          .fn()
          .mockResolvedValueOnce(triggerVoiceChannel)
          .mockResolvedValueOnce(occupiedVoiceChannel)
          .mockResolvedValueOnce(emptyVoiceChannel),
      },
    };
    const client = createClient(guild);

    await clientReadyEvent.execute(client as never);

    expect(removeTriggerChannelMock).not.toHaveBeenCalledWith(
      "guild-1",
      "trigger-voice",
    );
    expect(occupiedVoiceChannel.delete).not.toHaveBeenCalled();
    expect(emptyVoiceChannel.delete).toHaveBeenCalledTimes(1);
    expect(removeCreatedVacChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "created-empty",
    );
  });

  // VAC cleanup 全体で例外が発生した場合にログ出力されることを検証
  it("logs startup cleanup error when vac cleanup throws", async () => {
    getBumpReminderConfigServiceMock.mockReturnValue({});
    getBumpReminderManagerMock.mockReturnValue({
      restorePendingReminders: jest.fn().mockResolvedValue(undefined),
    });
    const cleanupError = new Error("vac cleanup failed");
    getVacConfigOrDefaultMock.mockRejectedValue(cleanupError);

    const guild: GuildLike = {
      id: "guild-1",
      channels: {
        fetch: jest.fn().mockResolvedValue(null),
      },
    };
    const client = createClient(guild);

    await clientReadyEvent.execute(client as never);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "system:vac.startup_cleanup_failed",
      cleanupError,
    );
  });
});
