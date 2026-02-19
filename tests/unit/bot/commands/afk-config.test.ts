import type { ChatInputCommandInteraction } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";

const setAfkChannelMock = jest.fn();
const getAfkConfigMock = jest.fn();
const tGuildMock = jest.fn();
const tDefaultMock = jest.fn((key: string) => `default:${key}`);
const createSuccessEmbedMock = jest.fn(
  (description: string, _options?: unknown) => ({
    kind: "success",
    description,
  }),
);
const createInfoEmbedMock = jest.fn(
  (description: string, _options?: unknown) => ({
    kind: "info",
    description,
  }),
);

// AFK設定永続化の呼び出しだけをモックし、コマンド分岐を直接検証する
jest.mock("../../../../src/shared/database", () => ({
  getGuildConfigRepository: () => ({
    setAfkChannel: (...args: unknown[]) => setAfkChannelMock(...args),
    getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
  }),
}));

// 共通エラーハンドラへの委譲可否を確認する
jest.mock("../../../../src/shared/errors/errorHandler", () => ({
  handleCommandError: jest.fn(),
}));

// i18n を固定値化して期待値を安定させる
jest.mock("../../../../src/shared/locale", () => ({
  getCommandLocalizations: () => ({
    ja: "desc",
    localizations: { "en-US": "desc" },
  }),
  tDefault: tDefaultMock,
  tGuild: tGuildMock,
}));

// メッセージ生成ユーティリティは生成結果を簡易オブジェクトに置換する
jest.mock("../../../../src/shared/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string, options?: unknown) =>
    createSuccessEmbedMock(description, options),
  createInfoEmbed: (description: string, options?: unknown) =>
    createInfoEmbedMock(description, options),
}));

// ログ出力の副作用を抑止
jest.mock("../../../../src/shared/utils/logger", () => ({
  logger: {
    info: jest.fn(),
  },
}));

import { afkConfigCommand } from "../../../../src/bot/commands/afk-config";
import { handleCommandError } from "../../../../src/shared/errors/errorHandler";

type AfkConfigInteraction = {
  guildId: string | null;
  channelId: string;
  memberPermissions: { has: jest.Mock };
  options: {
    getSubcommand: jest.Mock<string, []>;
    getChannel: jest.Mock;
  };
  reply: jest.Mock;
};

// afk-config 検証用の最小 interaction モック
function createInteraction(
  overrides?: Partial<AfkConfigInteraction>,
): AfkConfigInteraction {
  return {
    guildId: "guild-1",
    channelId: "channel-1",
    memberPermissions: {
      has: jest.fn(() => true),
    },
    options: {
      getSubcommand: jest.fn(() => "set-ch"),
      getChannel: jest.fn(() => ({
        id: "afk-channel",
        type: ChannelType.GuildVoice,
      })),
    },
    reply: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/afk-config", () => {
  // ケースごとにモック状態を初期化する
  beforeEach(() => {
    jest.clearAllMocks();
    tGuildMock.mockResolvedValue("translated");
    getAfkConfigMock.mockResolvedValue({ enabled: false, channelId: null });
  });

  // guild 外実行は統一エラーハンドラへ委譲されることを検証
  it("delegates guild-only validation error to handleCommandError", async () => {
    const interaction = createInteraction({ guildId: null });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // set-ch 正常系として保存と Ephemeral 返信を検証
  it("sets AFK channel on set-ch subcommand", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: jest.fn(() => "set-ch"),
        getChannel: jest.fn(() => ({
          id: "afk-channel",
          type: ChannelType.GuildVoice,
        })),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
    expect(setAfkChannelMock).toHaveBeenCalledWith("guild-1", "afk-channel");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ kind: "success", description: "translated" }],
      flags: 64,
    });
  });

  // 未知サブコマンドは共通エラーハンドラへ委譲されることを検証
  it("delegates invalid subcommand error", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: jest.fn(() => "unknown"),
        getChannel: jest.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // set-ch で権限不足の場合は共通エラーハンドラへ委譲されることを検証
  it("delegates permission error on set-ch", async () => {
    const interaction = createInteraction({
      memberPermissions: { has: jest.fn(() => false) },
      options: {
        getSubcommand: jest.fn(() => "set-ch"),
        getChannel: jest.fn(() => ({
          id: "afk-channel",
          type: ChannelType.GuildVoice,
        })),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // set-ch でVC以外を指定した場合は共通エラーハンドラへ委譲されることを検証
  it("delegates invalid channel type error on set-ch", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: jest.fn(() => "set-ch"),
        getChannel: jest.fn(() => ({
          id: "text-1",
          type: ChannelType.GuildText,
        })),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(setAfkChannelMock).not.toHaveBeenCalled();
  });

  // show 未設定時は情報 Embed を返すことを検証
  it("shows not-configured state on show subcommand", async () => {
    getAfkConfigMock.mockResolvedValueOnce(null);
    const interaction = createInteraction({
      options: {
        getSubcommand: jest.fn(() => "show"),
        getChannel: jest.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(getAfkConfigMock).toHaveBeenCalledWith("guild-1");
    expect(createInfoEmbedMock).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ kind: "info", description: "translated" }],
      flags: 64,
    });
  });

  // show で未設定判定の分岐（enabled=false / channelId=null）を網羅する
  it.each([
    { enabled: false, channelId: "afk-channel" },
    { enabled: true, channelId: null },
  ])("shows not-configured when config is invalid: %j", async (config) => {
    getAfkConfigMock.mockResolvedValueOnce(config);
    const interaction = createInteraction({
      options: {
        getSubcommand: jest.fn(() => "show"),
        getChannel: jest.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(createInfoEmbedMock).toHaveBeenCalledWith("translated", {
      title: "translated",
    });
  });

  // show で設定済みの場合にチャンネル情報を返すことを検証
  it("shows configured AFK channel on show subcommand", async () => {
    getAfkConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "afk-channel",
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: jest.fn(() => "show"),
        getChannel: jest.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(createInfoEmbedMock).toHaveBeenCalledWith("", {
      title: "translated",
      fields: [{ name: "translated", value: "<#afk-channel>", inline: true }],
    });
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ kind: "info", description: "" }],
      flags: 64,
    });
  });

  // show で権限不足の場合は共通エラーハンドラへ委譲されることを検証
  it("delegates permission error on show", async () => {
    const interaction = createInteraction({
      memberPermissions: { has: jest.fn(() => false) },
      options: {
        getSubcommand: jest.fn(() => "show"),
        getChannel: jest.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });
});
