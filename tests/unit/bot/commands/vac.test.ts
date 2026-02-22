import type { Mock } from "vitest";
import type { ChatInputCommandInteraction } from "discord.js";
import { ChannelType, MessageFlags } from "discord.js";

const isManagedVacChannelMock = vi.fn();
const tGuildMock = vi.hoisted(() => vi.fn());
const tDefaultMock = vi.hoisted(() => vi.fn((key: string) => `default:${key}`));
const createSuccessEmbedMock = vi.fn((description: string) => ({
  description,
}));

// VAC管理判定のみモック化し、コマンド分岐を直接検証する
vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: () => ({
    isManagedVacChannel: (...args: unknown[]) =>
      isManagedVacChannelMock(...args),
  }),
}));

// 共通エラーハンドラへの委譲を検証する
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

// i18n は固定値化して期待値を安定させる
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

// Embed 生成結果を簡易オブジェクト化
vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

import { vacCommand } from "@/bot/commands/vac";
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";

type VacInteraction = {
  guildId: string | null;
  user: { id: string };
  guild: {
    members: { fetch: Mock };
    channels: { fetch: Mock };
  };
  options: {
    getSubcommand: Mock;
    getString: Mock;
    getInteger: Mock;
  };
  reply: Mock;
};

// vac コマンド検証用の最小 interaction モック
function createInteraction(
  overrides?: Partial<VacInteraction>,
): VacInteraction {
  return {
    guildId: "guild-1",
    user: { id: "user-1" },
    guild: {
      members: {
        fetch: vi.fn().mockResolvedValue({
          voice: {
            channel: { id: "voice-1", type: ChannelType.GuildVoice },
          },
        }),
      },
      channels: {
        fetch: vi.fn().mockResolvedValue({
          id: "voice-1",
          type: ChannelType.GuildVoice,
          edit: vi.fn().mockResolvedValue(undefined),
        }),
      },
    },
    options: {
      getSubcommand: vi.fn(() => "vc-rename"),
      getString: vi.fn(() => "My VC"),
      getInteger: vi.fn(() => 10),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/vac", () => {
  // ケースごとにモックを初期化する
  beforeEach(() => {
    vi.clearAllMocks();
    tGuildMock.mockResolvedValue("translated");
    isManagedVacChannelMock.mockResolvedValue(true);
  });

  // guild 外実行は統一エラーハンドラへ流れることを検証
  it("delegates guild-only validation error to handleCommandError", async () => {
    const interaction = createInteraction({ guildId: null });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // VC未参加時はエラー委譲されることを検証
  it("delegates error when user is not in voice channel", async () => {
    const interaction = createInteraction({
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: { channel: null },
          }),
        },
        channels: {
          fetch: vi.fn(),
        },
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // vc-rename 正常系の応答を検証
  it("renames managed voice channel and replies success embed", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "vc-rename"),
        getString: vi.fn(() => "Renamed VC"),
        getInteger: vi.fn(() => 10),
      },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildVoice,
            edit: editMock,
          }),
        },
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(isManagedVacChannelMock).toHaveBeenCalledWith("guild-1", "voice-1");
    expect(editMock).toHaveBeenCalledWith({ name: "Renamed VC" });
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // vc-limit の範囲外入力はエラー委譲されることを検証
  it("delegates error when vc-limit is out of range", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "vc-limit"),
        getString: vi.fn(),
        getInteger: vi.fn(() => 120),
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // 管理対象VCでない場合はエラー委譲されることを検証
  it("delegates error when current voice channel is not managed by VAC", async () => {
    isManagedVacChannelMock.mockResolvedValueOnce(false);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "vc-rename"),
        getString: vi.fn(() => "Name"),
        getInteger: vi.fn(() => 10),
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // 未知サブコマンドはエラー委譲されることを検証
  it("delegates error for invalid subcommand", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "unknown"),
        getString: vi.fn(() => "Name"),
        getInteger: vi.fn(() => 10),
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // vc-rename で取得チャンネルがVoice以外ならエラー委譲されることを検証
  it("delegates error when rename target channel is not voice", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "vc-rename"),
        getString: vi.fn(() => "Renamed VC"),
        getInteger: vi.fn(() => 10),
      },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildText,
          }),
        },
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // vc-limit 正常系（制限あり）を検証
  it("sets user limit on managed voice channel and replies success", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "vc-limit"),
        getString: vi.fn(),
        getInteger: vi.fn(() => 12),
      },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildVoice,
            edit: editMock,
          }),
        },
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(editMock).toHaveBeenCalledWith({ userLimit: 12 });
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // vc-limit 0 は unlimited 表示で成功することを検証
  it("uses unlimited label when vc-limit is zero", async () => {
    const editMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "vc-limit"),
        getString: vi.fn(),
        getInteger: vi.fn(() => 0),
      },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildVoice,
            edit: editMock,
          }),
        },
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(editMock).toHaveBeenCalledWith({ userLimit: 0 });
    expect(createSuccessEmbedMock).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // vc-limit で取得チャンネルがVoice以外ならエラー委譲されることを検証
  it("delegates error when limit target channel is not voice", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "vc-limit"),
        getString: vi.fn(),
        getInteger: vi.fn(() => 10),
      },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildText,
          }),
        },
      },
    });

    await vacCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });
});
