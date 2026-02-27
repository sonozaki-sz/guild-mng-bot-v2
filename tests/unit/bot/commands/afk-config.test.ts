// tests/unit/bot/commands/afk-config.test.ts
import type { ChatInputCommandInteraction } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import type { Mock } from "vitest";

const setAfkChannelMock = vi.fn();
const getAfkConfigMock = vi.fn();
const tGuildMock = vi.hoisted(() => vi.fn());
const tDefaultMock = vi.hoisted(() => vi.fn((key: string) => `default:${key}`));
const createSuccessEmbedMock = vi.fn(
  (description: string, _options?: unknown) => ({
    kind: "success",
    description,
  }),
);
const createInfoEmbedMock = vi.fn(
  (description: string, _options?: unknown) => ({
    kind: "info",
    description,
  }),
);

// AFK設定永続化の呼び出しだけをモックし、コマンド分岐を直接検証する
vi.mock("@/bot/services/botGuildConfigRepositoryResolver", () => ({
  getBotGuildConfigRepository: () => ({
    setAfkChannel: (...args: unknown[]) => setAfkChannelMock(...args),
    getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
  }),
}));

vi.mock("@/shared/database/guildConfigRepositoryProvider", () => ({
  getGuildConfigRepository: () => ({
    setAfkChannel: (...args: unknown[]) => setAfkChannelMock(...args),
    getAfkConfig: (...args: unknown[]) => getAfkConfigMock(...args),
  }),
}));

// 共通エラーハンドラへの委譲可否を確認する
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

// i18n を固定値化して期待値を安定させる
vi.mock("@/shared/locale/commandLocalizations", () => ({
  getCommandLocalizations: () => ({
    ja: "desc",
    localizations: { "en-US": "desc" },
  }),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: tDefaultMock,
  tGuild: tGuildMock,
}));

// メッセージ生成ユーティリティは生成結果を簡易オブジェクトに置換する
vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string, options?: unknown) =>
    createSuccessEmbedMock(description, options),
  createInfoEmbed: (description: string, options?: unknown) =>
    createInfoEmbedMock(description, options),
}));

// ログ出力の副作用を抑止
vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { afkConfigCommand } from "@/bot/commands/afk-config";
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";

type AfkConfigInteraction = {
  guildId: string | null;
  channelId: string;
  memberPermissions: { has: Mock };
  options: {
    getSubcommand: Mock<() => string>;
    getChannel: Mock;
  };
  reply: Mock;
};

// afk-config 検証用の最小 interaction モック
function createInteraction(
  overrides?: Partial<AfkConfigInteraction>,
): AfkConfigInteraction {
  return {
    guildId: "guild-1",
    channelId: "channel-1",
    memberPermissions: {
      has: vi.fn(() => true),
    },
    options: {
      getSubcommand: vi.fn(() => "set-channel"),
      getChannel: vi.fn(() => ({
        id: "afk-channel",
        type: ChannelType.GuildVoice,
      })),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/afk-config", () => {
  // ケースごとにモック状態を初期化する
  beforeEach(() => {
    vi.clearAllMocks();
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

  // set-channel 正常系として保存と Ephemeral 返信を検証
  it("sets AFK channel on set-channel subcommand", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-channel"),
        getChannel: vi.fn(() => ({
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
        getSubcommand: vi.fn(() => "unknown"),
        getChannel: vi.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // set-channel で権限不足の場合は共通エラーハンドラへ委譲されることを検証
  it("delegates permission error on set-channel", async () => {
    const interaction = createInteraction({
      memberPermissions: { has: vi.fn(() => false) },
      options: {
        getSubcommand: vi.fn(() => "set-channel"),
        getChannel: vi.fn(() => ({
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

  // set-channel でVC以外を指定した場合は共通エラーハンドラへ委譲されることを検証
  it("delegates invalid channel type error on set-channel", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-channel"),
        getChannel: vi.fn(() => ({
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

  // view 未設定時は情報 Embed を返すことを検証
  it("shows not-configured state on view subcommand", async () => {
    getAfkConfigMock.mockResolvedValueOnce(null);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getChannel: vi.fn(),
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

  // view で未設定判定の分岐（enabled=false / channelId=null）を網羅する
  it.each([
    { enabled: false, channelId: "afk-channel" },
    { enabled: true, channelId: null },
  ])("shows not-configured when config is invalid: %j", async (config) => {
    getAfkConfigMock.mockResolvedValueOnce(config);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getChannel: vi.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(createInfoEmbedMock).toHaveBeenCalledWith("translated", {
      title: "translated",
    });
  });

  // view で設定済みの場合にチャンネル情報を返すことを検証
  it("shows configured AFK channel on view subcommand", async () => {
    getAfkConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "afk-channel",
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getChannel: vi.fn(),
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

  // view で権限不足の場合は共通エラーハンドラへ委譲されることを検証
  it("delegates permission error on view", async () => {
    const interaction = createInteraction({
      memberPermissions: { has: vi.fn(() => false) },
      options: {
        getSubcommand: vi.fn(() => "view"),
        getChannel: vi.fn(),
      },
    });

    await afkConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });
});
