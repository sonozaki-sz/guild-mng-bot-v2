import type { ChatInputCommandInteraction } from "discord.js";

const getAfkConfigMock = jest.fn();
const tGuildMock = jest.fn();
const tDefaultMock = jest.fn((key: string) => `default:${key}`);
const createSuccessEmbedMock = jest.fn((description: string) => ({
  description,
}));

// DB依存は AFK 設定取得のみをモックし、コマンド本体ロジックを直接検証する
jest.mock("../../../../src/shared/database", () => ({
  getGuildConfigRepository: () => ({
    getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
  }),
}));

// 共通エラーハンドラの委譲を検証する
jest.mock("../../../../src/shared/errors/errorHandler", () => ({
  handleCommandError: jest.fn(),
}));

// i18n を固定文字列化してアサーションを単純化する
jest.mock("../../../../src/shared/locale", () => ({
  tDefault: tDefaultMock,
  tGuild: tGuildMock,
}));

// コマンド定義生成に必要な localizations を簡易モック
jest.mock("../../../../src/shared/locale/commandLocalizations", () => ({
  getCommandLocalizations: () => ({
    ja: "desc",
    localizations: { "en-US": "desc" },
  }),
}));

// Embed 生成は引数検証に集中する
jest.mock("../../../../src/shared/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

// ログ出力の副作用を抑止する
jest.mock("../../../../src/shared/utils/logger", () => ({
  logger: {
    info: jest.fn(),
  },
}));

import { afkCommand } from "../../../../src/bot/commands/afk";
import { handleCommandError } from "../../../../src/shared/errors/errorHandler";

type AfkInteraction = {
  guildId: string | null;
  user: { id: string };
  options: {
    getUser: jest.Mock;
  };
  guild: {
    members: { fetch: jest.Mock };
    channels: { fetch: jest.Mock };
  };
  reply: jest.Mock;
};

// AFKコマンド検証用の最小 interaction モック
function createInteraction(
  overrides?: Partial<AfkInteraction>,
): AfkInteraction {
  return {
    guildId: "guild-1",
    user: { id: "user-1" },
    options: {
      getUser: jest.fn(() => null),
    },
    guild: {
      members: {
        fetch: jest.fn().mockResolvedValue({
          voice: {
            channel: { id: "voice-1" },
            setChannel: jest.fn().mockResolvedValue(undefined),
          },
        }),
      },
      channels: {
        fetch: jest.fn().mockResolvedValue({
          id: "afk-channel",
          type: 2,
        }),
      },
    },
    reply: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/afk", () => {
  // 各ケースでモックを初期化し、相互影響を防ぐ
  beforeEach(() => {
    jest.clearAllMocks();
    tGuildMock.mockResolvedValue("translated");
    getAfkConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "afk-channel",
    });
  });

  // guild 外実行時は ValidationError が共通エラーハンドラへ流れることを検証
  it("delegates guild-only validation error to handleCommandError", async () => {
    const interaction = createInteraction({ guildId: null });

    await afkCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // AFK未設定時はエラー委譲されることを検証
  it("delegates error when AFK is not configured", async () => {
    getAfkConfigMock.mockResolvedValueOnce(null);
    const interaction = createInteraction();

    await afkCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // AFK無効設定でもエラー委譲されることを検証
  it("delegates error when AFK config is disabled", async () => {
    getAfkConfigMock.mockResolvedValueOnce({
      enabled: false,
      channelId: "afk-channel",
    });
    const interaction = createInteraction();

    await afkCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // メンバー取得失敗時はエラー委譲されることを検証
  it("delegates error when target member cannot be fetched", async () => {
    const interaction = createInteraction({
      guild: {
        members: {
          fetch: jest.fn().mockRejectedValue(new Error("fetch failed")),
        },
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "afk-channel",
            type: 2,
          }),
        },
      },
    });

    await afkCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // ボイス未接続ユーザーはエラー委譲されることを検証
  it("delegates error when target user is not in voice channel", async () => {
    const interaction = createInteraction({
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: {
              channel: null,
              setChannel: jest.fn().mockResolvedValue(undefined),
            },
          }),
        },
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "afk-channel",
            type: 2,
          }),
        },
      },
    });

    await afkCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // AFKチャンネルが見つからない場合はエラー委譲されることを検証
  it("delegates error when AFK channel is missing", async () => {
    const interaction = createInteraction({
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1" },
              setChannel: jest.fn().mockResolvedValue(undefined),
            },
          }),
        },
        channels: {
          fetch: jest.fn().mockRejectedValue(new Error("channel fetch failed")),
        },
      },
    });

    await afkCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // user オプション指定時は指定ユーザーを優先して移動することを検証
  it("moves explicitly selected user when option user is provided", async () => {
    const setChannelMock = jest.fn().mockResolvedValue(undefined);
    const interaction = createInteraction({
      user: { id: "executor-1" },
      options: {
        getUser: jest.fn(() => ({ id: "target-1" })),
      },
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1" },
              setChannel: setChannelMock,
            },
          }),
        },
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "afk-channel",
            type: 2,
          }),
        },
      },
    });

    await afkCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.guild.members.fetch).toHaveBeenCalledWith("target-1");
    expect(setChannelMock).toHaveBeenCalledWith({
      id: "afk-channel",
      type: 2,
    });
  });

  // 正常系としてユーザー移動と成功応答を返すことを検証
  it("moves target user and replies success embed", async () => {
    const setChannelMock = jest.fn().mockResolvedValue(undefined);
    const interaction = createInteraction({
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1" },
              setChannel: setChannelMock,
            },
          }),
        },
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "afk-channel",
            type: 2,
          }),
        },
      },
    });

    await afkCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(setChannelMock).toHaveBeenCalledWith({
      id: "afk-channel",
      type: 2,
    });
    expect(createSuccessEmbedMock).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
    });
  });
});
