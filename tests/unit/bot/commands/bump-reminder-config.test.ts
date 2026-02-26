// tests/unit/bot/commands/bump-reminder-config.test.ts
import type { ChatInputCommandInteraction } from "discord.js";
import { DiscordAPIError, MessageFlags, PermissionFlagsBits } from "discord.js";
import type { Mock } from "vitest";

const setBumpReminderEnabledMock = vi.fn();
const getBumpReminderConfigMock = vi.fn();
const setBumpReminderMentionRoleMock = vi.fn();
const addBumpReminderMentionUserMock = vi.fn();
const clearBumpReminderMentionUsersMock = vi.fn();
const clearBumpReminderMentionsMock = vi.fn();
const removeBumpReminderMentionUserMock = vi.fn();
const cancelReminderMock = vi.fn();
const tDefaultMock = vi.hoisted(() => vi.fn((key: string) => `default:${key}`));
const tGuildMock = vi.hoisted(() => vi.fn());
const createSuccessEmbedMock = vi.fn((description: string) => ({
  description,
}));

// Bump設定サービス依存を置き換えてコマンド分岐を直接検証する
vi.mock("@/shared/features/bump-reminder/bumpReminderConfigService", () => ({
  BUMP_REMINDER_MENTION_CLEAR_RESULT: {
    CLEARED: "cleared",
    NOT_CONFIGURED: "not_configured",
  },
  BUMP_REMINDER_MENTION_ROLE_RESULT: {
    UPDATED: "updated",
    CLEARED: "cleared",
    NOT_CONFIGURED: "not_configured",
  },
  BUMP_REMINDER_MENTION_USER_ADD_RESULT: {
    ADDED: "added",
    ALREADY_EXISTS: "already_exists",
    NOT_CONFIGURED: "not_configured",
  },
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT: {
    REMOVED: "removed",
    NOT_FOUND: "not_found",
    NOT_CONFIGURED: "not_configured",
  },
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT: {
    CLEARED: "cleared",
    EMPTY: "empty",
    NOT_CONFIGURED: "not_configured",
  },
  getBumpReminderConfigService: vi.fn(() => ({
    setBumpReminderEnabled: (...args: unknown[]) =>
      setBumpReminderEnabledMock(...args),
    getBumpReminderConfig: (...args: unknown[]) =>
      getBumpReminderConfigMock(...args),
    setBumpReminderMentionRole: (...args: unknown[]) =>
      setBumpReminderMentionRoleMock(...args),
    addBumpReminderMentionUser: (...args: unknown[]) =>
      addBumpReminderMentionUserMock(...args),
    clearBumpReminderMentionUsers: (...args: unknown[]) =>
      clearBumpReminderMentionUsersMock(...args),
    clearBumpReminderMentions: (...args: unknown[]) =>
      clearBumpReminderMentionsMock(...args),
    removeBumpReminderMentionUser: (...args: unknown[]) =>
      removeBumpReminderMentionUserMock(...args),
  })),
}));

vi.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderConfigService: vi.fn(() => ({
    setBumpReminderEnabled: (...args: unknown[]) =>
      setBumpReminderEnabledMock(...args),
    getBumpReminderConfig: (...args: unknown[]) =>
      getBumpReminderConfigMock(...args),
    setBumpReminderMentionRole: (...args: unknown[]) =>
      setBumpReminderMentionRoleMock(...args),
    addBumpReminderMentionUser: (...args: unknown[]) =>
      addBumpReminderMentionUserMock(...args),
    clearBumpReminderMentionUsers: (...args: unknown[]) =>
      clearBumpReminderMentionUsersMock(...args),
    clearBumpReminderMentions: (...args: unknown[]) =>
      clearBumpReminderMentionsMock(...args),
    removeBumpReminderMentionUser: (...args: unknown[]) =>
      removeBumpReminderMentionUserMock(...args),
  })),
  getBotBumpReminderManager: vi.fn(() => ({
    cancelReminder: (...args: unknown[]) => cancelReminderMock(...args),
  })),
}));

// 共通エラーハンドラの委譲を確認
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

// メッセージ生成は簡易オブジェクト化
vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((message: string) => ({ message })),
  createInfoEmbed: vi.fn((message: string) => ({ message })),
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

// ログ出力の副作用を抑止
vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { bumpReminderConfigCommand } from "@/bot/commands/bump-reminder-config";
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";

type InteractionLike = {
  guildId: string | null;
  channelId: string;
  user: { id: string };
  guild?: {
    members: {
      fetch: Mock;
    };
  };
  memberPermissions: { has: Mock };
  options: {
    getSubcommand: Mock;
    getRole: Mock;
    getUser: Mock;
    getString: Mock;
  };
  reply: Mock;
  editReply: Mock;
};

// bump-reminder-config 検証用 interaction モック
function createInteraction(
  overrides?: Partial<InteractionLike>,
): InteractionLike {
  return {
    guildId: "guild-1",
    channelId: "channel-1",
    user: { id: "operator-1" },
    guild: {
      members: {
        fetch: vi.fn().mockResolvedValue(null),
      },
    },
    memberPermissions: { has: vi.fn(() => true) },
    options: {
      getSubcommand: vi.fn(() => "enable"),
      getRole: vi.fn(() => null),
      getUser: vi.fn(() => null),
      getString: vi.fn(() => null),
    },
    reply: vi.fn().mockResolvedValue({
      awaitMessageComponent: vi.fn(),
    }),
    editReply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/bump-reminder-config", () => {
  // ケースごとにモックを初期化する
  beforeEach(() => {
    vi.clearAllMocks();
    tGuildMock.mockResolvedValue("translated");
    cancelReminderMock.mockResolvedValue(undefined);
    setBumpReminderEnabledMock.mockResolvedValue(undefined);
    getBumpReminderConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: "role-1",
      mentionUserIds: ["user-2"],
    });
    setBumpReminderMentionRoleMock.mockResolvedValue("updated");
    addBumpReminderMentionUserMock.mockResolvedValue("added");
    clearBumpReminderMentionUsersMock.mockResolvedValue("cleared");
    clearBumpReminderMentionsMock.mockResolvedValue("cleared");
    removeBumpReminderMentionUserMock.mockResolvedValue("removed");
  });

  // guild 外実行時は共通エラーハンドラへ委譲されることを検証
  it("delegates guild-only error to handleCommandError", async () => {
    const interaction = createInteraction({ guildId: null });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // enable で設定有効化と成功応答が行われることを検証
  it("enables bump reminder and replies success", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "enable"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
    expect(setBumpReminderEnabledMock).toHaveBeenCalledWith(
      "guild-1",
      true,
      "channel-1",
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // disable でタイマー停止と設定無効化が行われることを検証
  it("disables bump reminder and cancels active reminder", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "disable"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(cancelReminderMock).toHaveBeenCalledWith("guild-1");
    expect(setBumpReminderEnabledMock).toHaveBeenCalledWith("guild-1", false);
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // 未知のサブコマンドはエラーハンドラに委譲されることを検証
  it("delegates invalid subcommand error to handleCommandError", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "unknown-subcommand"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // 各サブコマンドの権限不足時にエラーハンドラへ委譲されることを検証
  it.each(["enable", "disable", "set-mention", "remove-mention", "view"])(
    "delegates permission error when subcommand is %s",
    async (subcommand) => {
      const interaction = createInteraction({
        memberPermissions: { has: vi.fn(() => false) },
        options: {
          getSubcommand: vi.fn(() => subcommand),
          getRole: vi.fn(() => null),
          getUser: vi.fn(() => null),
          getString: vi.fn(() => "role"),
        },
      });

      await bumpReminderConfigCommand.execute(
        interaction as unknown as ChatInputCommandInteraction,
      );

      expect(handleCommandError).toHaveBeenCalledTimes(1);
    },
  );

  // set-mention で role/user 未指定の場合にエラー委譲されることを検証
  it("delegates validation error when set-mention has no role and user", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // set-mention user(追加) が成功することを検証
  it("adds mention user on set-mention user path", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("added");
    getBumpReminderConfigMock
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: [],
      })
      .mockResolvedValueOnce(null);

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(addBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-9",
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // set-mention role 単独指定の成功経路を検証
  it("sets mention role only on set-mention success", async () => {
    setBumpReminderMentionRoleMock.mockResolvedValueOnce("updated");
    getBumpReminderConfigMock
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: ["user-1"],
      })
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: "role-7",
        mentionUserIds: ["user-1"],
      });

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => ({ id: "role-7" })),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // set-mention user(既存) がトグル削除されることを検証
  it("toggles mention user off when set-mention user already exists", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("already_exists");
    removeBumpReminderMentionUserMock.mockResolvedValueOnce("removed");
    getBumpReminderConfigMock
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: ["user-9"],
      })
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: [],
      });

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(removeBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-9",
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // set-mention user add が失敗した場合のエラー委譲を検証
  it("delegates error when set-mention user add result is not configured", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // set-mention user remove が未設定を返した場合のエラー委譲を検証
  it("delegates error when toggling existing user but remove returns not configured", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("already_exists");
    removeBumpReminderMentionUserMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // set-mention role が未設定を返した場合のエラー委譲を検証
  it("delegates error when set-mention role result is not configured", async () => {
    setBumpReminderMentionRoleMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => ({ id: "role-7" })),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // set-mention role + user 同時指定の成功経路を検証
  it("sets both mention role and user on set-mention success", async () => {
    addBumpReminderMentionUserMock.mockResolvedValueOnce("added");
    setBumpReminderMentionRoleMock.mockResolvedValueOnce("updated");
    getBumpReminderConfigMock
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: [],
      })
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: null,
        mentionUserIds: ["user-9"],
      })
      .mockResolvedValueOnce({
        enabled: true,
        channelId: "channel-1",
        mentionRoleId: "role-7",
        mentionUserIds: ["user-9"],
      });

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "set-mention"),
        getRole: vi.fn(() => ({ id: "role-7" })),
        getUser: vi.fn(() => ({ id: "user-9" })),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(addBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-9",
    );
    expect(setBumpReminderMentionRoleMock).toHaveBeenCalledWith(
      "guild-1",
      "role-7",
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated\ntranslated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // view で設定未登録時に info 応答することを検証
  it("replies not-configured info on view when config is absent", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce(null);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ message: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // view で設定内容（enabled/role/users）を表示することを検証
  it("replies configured info on view with role and users", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: false,
      channelId: "channel-1",
      mentionRoleId: "role-2",
      mentionUserIds: ["user-a", "user-b"],
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [
        {
          message: "",
        },
      ],
      flags: MessageFlags.Ephemeral,
    });
  });

  // view で role/users未設定かつ enabled=true の表示分岐を検証
  it("replies configured info on view with no role and no users", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: [],
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [
        {
          message: "",
        },
      ],
      flags: MessageFlags.Ephemeral,
    });
  });

  // remove-mention role でロールメンション解除されることを検証
  it("removes role mention on remove-mention target=role", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "role"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(setBumpReminderMentionRoleMock).toHaveBeenCalledWith(
      "guild-1",
      undefined,
    );
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // remove-mention role で未設定の場合は共通エラーハンドラへ委譲されることを検証
  it("delegates not-configured error when remove-mention target=role", async () => {
    setBumpReminderMentionRoleMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "role"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(setBumpReminderMentionRoleMock).toHaveBeenCalledWith(
      "guild-1",
      undefined,
    );
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // remove-mention users で全ユーザーメンション解除されることを検証
  it("clears all user mentions on remove-mention target=users", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "users"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(clearBumpReminderMentionUsersMock).toHaveBeenCalledWith("guild-1");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // remove-mention users で未設定の場合は共通エラーハンドラへ委譲されることを検証
  it("delegates not-configured error when remove-mention target=users", async () => {
    clearBumpReminderMentionUsersMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "users"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(clearBumpReminderMentionUsersMock).toHaveBeenCalledWith("guild-1");
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // remove-mention all でロール＋ユーザーをまとめて解除することを検証
  it("clears all mentions on remove-mention target=all", async () => {
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "all"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(clearBumpReminderMentionsMock).toHaveBeenCalledWith("guild-1");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // remove-mention all で未設定の場合は共通エラーハンドラへ委譲されることを検証
  it("delegates not-configured error when remove-mention target=all", async () => {
    clearBumpReminderMentionsMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "all"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(clearBumpReminderMentionsMock).toHaveBeenCalledWith("guild-1");
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // remove-mention user で登録ユーザーが空のときエラー応答になることを検証
  it("replies error when remove-mention target=user has no registered users", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: [],
    });
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ message: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // remove-mention user で currentConfig が null の場合も空扱いでエラー応答することを検証
  it("replies error when remove-mention target=user and config is null", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce(null);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ message: "translated" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  // remove-mention user でUI待機がタイムアウトした場合に editReply されることを検証
  it("edits reply with timeout message when user-selection collector times out", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: ["user-a"],
    });

    const awaitMessageComponent = vi
      .fn()
      .mockRejectedValue(new Error("collector ended with reason: time"));
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
      reply: vi.fn().mockResolvedValue({
        awaitMessageComponent,
      }),
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(awaitMessageComponent).toHaveBeenCalledTimes(1);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "translated",
      components: [],
    });
  });

  // remove-mention user で選択したユーザーを削除して update 応答することを検証
  it("removes selected users and updates interaction on remove-mention target=user success", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: ["user-a", "user-b"],
    });
    removeBumpReminderMentionUserMock
      .mockResolvedValueOnce("removed")
      .mockResolvedValueOnce("not_found");

    const updateMock = vi.fn().mockResolvedValue(undefined);
    const awaitMessageComponent = vi
      .fn()
      .mockImplementation(async (options: { filter: (i: any) => boolean }) => {
        expect(
          options.filter({
            customId: "bump-remove-users-guild-1",
            user: { id: "operator-1" },
          }),
        ).toBe(true);
        expect(
          options.filter({
            customId: "bump-remove-users-guild-1",
            user: { id: "other-user" },
          }),
        ).toBe(false);

        return {
          values: ["user-a", "user-b"],
          update: updateMock,
          user: { id: "operator-1" },
          customId: "bump-remove-users-guild-1",
        };
      });

    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
      guild: {
        members: {
          fetch: vi.fn((id: string) => {
            if (id === "user-b") {
              return Promise.reject(new Error("member fetch failed"));
            }
            return Promise.resolve({
              displayName: `member-${id}`,
              user: { username: `user-${id}` },
            });
          }),
        },
      },
      reply: vi.fn().mockResolvedValue({
        awaitMessageComponent,
      }),
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(awaitMessageComponent).toHaveBeenCalledTimes(1);
    expect(removeBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-a",
    );
    expect(removeBumpReminderMentionUserMock).toHaveBeenCalledWith(
      "guild-1",
      "user-b",
    );
    expect(updateMock).toHaveBeenCalledWith({
      content: "",
      embeds: [{ description: "translated" }],
      components: [],
    });
  });

  // remove-mention user でDiscord APIエラーが発生した場合に上位へ委譲されることを検証
  it("delegates DiscordAPIError from user-selection collector", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: ["user-a"],
    });

    const apiError = Object.create(
      DiscordAPIError.prototype,
    ) as DiscordAPIError;
    const awaitMessageComponent = vi.fn().mockRejectedValue(apiError);
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
      reply: vi.fn().mockResolvedValue({
        awaitMessageComponent,
      }),
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // remove-mention user で予期しないエラーが発生した場合に上位へ委譲されることを検証
  it("delegates unexpected collector error on remove-mention target=user", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      channelId: "channel-1",
      mentionRoleId: null,
      mentionUserIds: ["user-a"],
    });

    const awaitMessageComponent = vi
      .fn()
      .mockRejectedValue(new Error("collector crashed"));
    const interaction = createInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-mention"),
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
        getString: vi.fn(() => "user"),
      },
      reply: vi.fn().mockResolvedValue({
        awaitMessageComponent,
      }),
    });

    await bumpReminderConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });
});
