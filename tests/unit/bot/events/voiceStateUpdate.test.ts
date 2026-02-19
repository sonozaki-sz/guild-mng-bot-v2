import { ChannelType } from "discord.js";
import { voiceStateUpdateEvent } from "../../../../src/bot/events/voiceStateUpdate";

const getVacConfigOrDefaultMock = jest.fn();
const addCreatedVacChannelMock = jest.fn();
const removeCreatedVacChannelMock = jest.fn();
const sendVacControlPanelMock = jest.fn();
const loggerInfoMock = jest.fn();
const loggerWarnMock = jest.fn();
const loggerErrorMock = jest.fn();

// VAC設定操作をモックし、イベント本体の分岐挙動を検証する
jest.mock("../../../../src/shared/features/vac", () => ({
  getVacConfigOrDefault: (...args: unknown[]) =>
    getVacConfigOrDefaultMock(...args),
  addCreatedVacChannel: (...args: unknown[]) =>
    addCreatedVacChannelMock(...args),
  removeCreatedVacChannel: (...args: unknown[]) =>
    removeCreatedVacChannelMock(...args),
}));

// i18n とロガーは副作用抑止
jest.mock("../../../../src/shared/locale", () => ({
  tDefault: jest.fn((key: string) => key),
}));
jest.mock("../../../../src/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

// パネル送信の呼び出し有無のみ検証
jest.mock(
  "../../../../src/bot/features/vac/handlers/ui/vacControlPanel",
  () => ({
    sendVacControlPanel: (...args: unknown[]) =>
      sendVacControlPanelMock(...args),
  }),
);

type VoiceStateLike = {
  channelId: string | null;
  guild?: { id: string };
  channel: {
    id: string;
    type: ChannelType;
    parent: {
      id: string;
      type: ChannelType;
      children: { cache: { size: number } };
    } | null;
    members: { size: number };
    guild: { id: string };
    delete: jest.Mock;
  } | null;
  member: {
    id: string;
    displayName: string;
    guild: {
      id: string;
      channels: {
        cache: { find: jest.Mock };
        fetch: jest.Mock;
        create: jest.Mock;
      };
    };
    voice: {
      setChannel: jest.Mock;
    };
  } | null;
};

// voiceStateUpdate 検証用の最小 state モック
function createState(overrides?: Partial<VoiceStateLike>): VoiceStateLike {
  const oldVoiceChannel = {
    id: "old-voice",
    type: ChannelType.GuildVoice,
    parent: null,
    members: { size: 0 },
    guild: { id: "guild-1" },
    delete: jest.fn().mockResolvedValue(undefined),
  };

  return {
    channelId: "voice-1",
    guild: { id: "guild-1" },
    channel: oldVoiceChannel,
    member: {
      id: "user-1",
      displayName: "Alice",
      guild: {
        id: "guild-1",
        channels: {
          cache: {
            find: jest.fn(() => undefined),
          },
          fetch: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: "created-voice",
            type: ChannelType.GuildVoice,
          }),
        },
      },
      voice: {
        setChannel: jest.fn().mockResolvedValue(undefined),
      },
    },
    ...overrides,
  };
}

describe("bot/events/voiceStateUpdate", () => {
  // 各ケースでモック状態を初期化
  beforeEach(() => {
    jest.clearAllMocks();
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["voice-1"],
      createdChannels: [],
    });
    sendVacControlPanelMock.mockResolvedValue(undefined);
  });

  // チャンネル移動なし更新は処理しないことを検証
  it("ignores updates without channel movement", async () => {
    const oldState = createState({ channelId: "same" });
    const newState = createState({ channelId: "same" });

    await voiceStateUpdateEvent.execute(oldState as never, newState as never);

    expect(addCreatedVacChannelMock).not.toHaveBeenCalled();
    expect(removeCreatedVacChannelMock).not.toHaveBeenCalled();
  });

  // トリガー入室時に VC を作成して移動・設定保存することを検証
  it("creates managed voice channel when joining trigger channel", async () => {
    const newVoiceChannel = {
      id: "voice-1",
      type: ChannelType.GuildVoice,
      parent: null,
      members: { size: 1 },
      guild: { id: "guild-1" },
      delete: jest.fn(),
    };
    const oldState = createState({
      channelId: null,
      channel: null,
      member: null,
    });
    const newState = createState({
      channelId: "voice-1",
      channel: newVoiceChannel,
    });

    await voiceStateUpdateEvent.execute(oldState as never, newState as never);

    expect(newState.member?.guild.channels.create).toHaveBeenCalled();
    expect(sendVacControlPanelMock).toHaveBeenCalled();
    expect(newState.member?.voice.setChannel).toHaveBeenCalledWith({
      id: "created-voice",
      type: ChannelType.GuildVoice,
    });
    expect(addCreatedVacChannelMock).toHaveBeenCalled();
  });

  // 管理VCが空になったら削除と設定同期を行うことを検証
  it("deletes empty managed channel on leave", async () => {
    const oldChannel = {
      id: "managed-1",
      type: ChannelType.GuildVoice,
      parent: null,
      members: { size: 0 },
      guild: { id: "guild-1" },
      delete: jest.fn().mockRejectedValue(new Error("delete failed")),
    };

    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["voice-1"],
      createdChannels: [
        { voiceChannelId: "managed-1", ownerId: "user-1", createdAt: 1 },
      ],
    });

    const oldState = createState({
      channelId: "managed-1",
      channel: oldChannel,
    });
    const newState = createState({
      channelId: null,
      channel: null,
    });

    await voiceStateUpdateEvent.execute(oldState as never, newState as never);

    expect(oldChannel.delete).toHaveBeenCalledTimes(1);
    expect(removeCreatedVacChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "managed-1",
    );
  });

  // VAC無効またはトリガー外チャンネルでは作成しないことを検証
  it.each([
    {
      label: "disabled",
      config: {
        enabled: false,
        triggerChannelIds: ["voice-1"],
        createdChannels: [],
      },
    },
    {
      label: "not-trigger",
      config: {
        enabled: true,
        triggerChannelIds: ["another"],
        createdChannels: [],
      },
    },
  ])("skips creation when config is %s", async ({ config }) => {
    getVacConfigOrDefaultMock.mockResolvedValueOnce(config);

    const oldState = createState({
      channelId: null,
      channel: null,
      member: null,
    });
    const newState = createState({
      channelId: "voice-1",
      channel: {
        id: "voice-1",
        type: ChannelType.GuildVoice,
        parent: null,
        members: { size: 1 },
        guild: { id: "guild-1" },
        delete: jest.fn(),
      },
    });

    await voiceStateUpdateEvent.execute(oldState as never, newState as never);

    expect(newState.member?.guild.channels.create).not.toHaveBeenCalled();
    expect(addCreatedVacChannelMock).not.toHaveBeenCalled();
  });

  // 既存所有VCが有効なら新規作成せず再利用することを検証
  it("reuses existing owned voice channel when present", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["voice-1"],
      createdChannels: [
        { voiceChannelId: "owned-1", ownerId: "user-1", createdAt: 1 },
      ],
    });

    const ownedVoice = { id: "owned-1", type: ChannelType.GuildVoice };
    const newState = createState({
      channelId: "voice-1",
      channel: {
        id: "voice-1",
        type: ChannelType.GuildVoice,
        parent: null,
        members: { size: 1 },
        guild: { id: "guild-1" },
        delete: jest.fn(),
      },
    });
    newState.member?.guild.channels.fetch.mockResolvedValueOnce(ownedVoice);

    await voiceStateUpdateEvent.execute(
      createState({ channelId: null, channel: null, member: null }) as never,
      newState as never,
    );

    expect(newState.member?.voice.setChannel).toHaveBeenCalledWith(ownedVoice);
    expect(newState.member?.guild.channels.create).not.toHaveBeenCalled();
    expect(removeCreatedVacChannelMock).not.toHaveBeenCalledWith(
      "guild-1",
      "owned-1",
    );
  });

  // 既存所有VCが壊れている場合は設定を掃除し、カテゴリ上限で作成を中止することを検証
  it("cleans stale owned channel and aborts creation when parent category is full", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["voice-1"],
      createdChannels: [
        { voiceChannelId: "owned-stale", ownerId: "user-1", createdAt: 1 },
      ],
    });

    const fullParent = {
      id: "cat-1",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 50 } },
    };
    const newState = createState({
      channelId: "voice-1",
      channel: {
        id: "voice-1",
        type: ChannelType.GuildVoice,
        parent: fullParent,
        members: { size: 1 },
        guild: { id: "guild-1" },
        delete: jest.fn(),
      },
    });
    newState.member?.guild.channels.fetch.mockRejectedValueOnce(
      new Error("not found"),
    );

    await voiceStateUpdateEvent.execute(
      createState({ channelId: null, channel: null, member: null }) as never,
      newState as never,
    );

    expect(removeCreatedVacChannelMock).toHaveBeenCalledWith(
      "guild-1",
      "owned-stale",
    );
    expect(loggerWarnMock).toHaveBeenCalledWith("system:vac.category_full");
    expect(newState.member?.guild.channels.create).not.toHaveBeenCalled();
  });

  // 作成VCがVoice以外の場合は後続処理しないことを検証
  it("returns early when created channel is not voice", async () => {
    const newState = createState({
      channelId: "voice-1",
      channel: {
        id: "voice-1",
        type: ChannelType.GuildVoice,
        parent: null,
        members: { size: 1 },
        guild: { id: "guild-1" },
        delete: jest.fn(),
      },
    });
    newState.member?.guild.channels.create.mockResolvedValueOnce({
      id: "created-text",
      type: ChannelType.GuildText,
    });

    await voiceStateUpdateEvent.execute(
      createState({ channelId: null, channel: null, member: null }) as never,
      newState as never,
    );

    expect(sendVacControlPanelMock).not.toHaveBeenCalled();
    expect(addCreatedVacChannelMock).not.toHaveBeenCalled();
  });

  // パネル送信失敗時でも作成処理は継続し、重複名採番と退出スキップ分岐を通ることを検証
  it("continues after panel send failure and covers duplicate naming and leave-skip paths", async () => {
    sendVacControlPanelMock.mockRejectedValueOnce(new Error("panel failed"));

    const oldOccupied = {
      id: "managed-occupied",
      type: ChannelType.GuildVoice,
      parent: null,
      members: { size: 2 },
      guild: { id: "guild-1" },
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const oldState = createState({
      channelId: "managed-occupied",
      channel: oldOccupied,
    });

    const newState = createState({
      channelId: "voice-1",
      channel: {
        id: "voice-1",
        type: ChannelType.GuildVoice,
        parent: null,
        members: { size: 1 },
        guild: { id: "guild-1" },
        delete: jest.fn(),
      },
    });
    if (newState.member) {
      newState.member.guild.channels.cache = [
        { id: "dup-1", name: "Alice's Room" },
      ] as unknown as {
        find: jest.Mock;
      };
    }

    getVacConfigOrDefaultMock
      .mockResolvedValueOnce({
        enabled: true,
        triggerChannelIds: ["voice-1"],
        createdChannels: [],
      })
      .mockResolvedValueOnce({
        enabled: true,
        triggerChannelIds: ["voice-1"],
        createdChannels: [
          {
            voiceChannelId: "managed-occupied",
            ownerId: "user-1",
            createdAt: 1,
          },
        ],
      });

    await voiceStateUpdateEvent.execute(oldState as never, newState as never);

    expect(newState.member?.guild.channels.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Alice's Room (2)",
      }),
    );
    expect(loggerErrorMock).toHaveBeenCalledWith(
      "system:vac.panel_send_failed",
      expect.any(Error),
    );
    expect(removeCreatedVacChannelMock).not.toHaveBeenCalledWith(
      "guild-1",
      "managed-occupied",
    );
  });

  // 実行全体の例外はトップレベルcatchで処理されることを検証
  it("logs top-level error when voice state handler throws", async () => {
    const failure = new Error("vac config failed");
    getVacConfigOrDefaultMock.mockRejectedValueOnce(failure);

    const oldState = createState({
      channelId: null,
      channel: null,
      member: null,
    });
    const newState = createState({
      channelId: "voice-1",
      channel: {
        id: "voice-1",
        type: ChannelType.GuildVoice,
        parent: null,
        members: { size: 1 },
        guild: { id: "guild-1" },
        delete: jest.fn(),
      },
    });

    await voiceStateUpdateEvent.execute(oldState as never, newState as never);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "system:vac.voice_state_update_failed",
      failure,
    );
  });
});
