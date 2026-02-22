import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import type { Mock } from "vitest";

const addTriggerChannelMock = vi.fn();
const getVacConfigOrDefaultMock = vi.fn();
const removeTriggerChannelMock = vi.fn();
const tDefaultMock = vi.hoisted(() => vi.fn((key: string) => `default:${key}`));
const tGuildMock = vi.hoisted(() => vi.fn());
const createSuccessEmbedMock = vi.fn((description: string) => ({
  description,
}));
const createInfoEmbedMock = vi.fn((description: string, options?: unknown) => ({
  description,
  options,
}));

// VAC設定関数の依存を置き換え、コマンド分岐を実コードで検証する
vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: () => ({
    addTriggerChannel: (...args: unknown[]) => addTriggerChannelMock(...args),
    getVacConfigOrDefault: (...args: unknown[]) =>
      getVacConfigOrDefaultMock(...args),
    removeTriggerChannel: (...args: unknown[]) =>
      removeTriggerChannelMock(...args),
  }),
}));

// 共通エラーハンドラ委譲のみ検証する
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

// i18n を固定化して期待値を安定させる
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

// Embed 生成は簡易オブジェクトを返す
vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
  createInfoEmbed: (description: string, options?: unknown) =>
    createInfoEmbedMock(description, options),
}));

import { vacConfigCommand } from "@/bot/commands/vac-config";
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";

type CommandInteractionLike = {
  guildId: string | null;
  guild: {
    channels: {
      create: Mock;
      fetch: Mock;
      cache: {
        find: Mock;
        filter: Mock;
      };
    };
  } | null;
  channelId: string;
  memberPermissions: { has: Mock };
  options: {
    getSubcommand: Mock;
    getString: Mock;
  };
  reply: Mock;
};

type FakeChannel = {
  id: string;
  type: ChannelType;
  name?: string;
  parent?: { id: string; name?: string; type: ChannelType } | null;
  children?: { cache: { size: number } };
  delete?: Mock;
};

type AutocompleteInteractionLike = {
  commandName: string;
  guild: { id: string; channels: { cache: { filter: Mock } } } | null;
  options: {
    getSubcommand: Mock;
    getFocused: Mock;
  };
  respond: Mock;
};

// vac-config 実行用 interaction モック
function createCommandInteraction(
  overrides?: Partial<CommandInteractionLike>,
): CommandInteractionLike {
  return {
    guildId: "guild-1",
    guild: {
      channels: {
        create: vi.fn().mockResolvedValue({ id: "trigger-1" }),
        fetch: vi.fn().mockResolvedValue({ id: "text-1", parent: null }),
        cache: {
          find: vi.fn(() => null),
          filter: vi.fn(() => []),
        },
      },
    },
    channelId: "text-1",
    memberPermissions: { has: vi.fn(() => true) },
    options: {
      getSubcommand: vi.fn(() => "create-trigger-vc"),
      getString: vi.fn(() => null),
    },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createGuildWithChannels(options?: {
  byId?: Record<string, FakeChannel | null>;
  cacheList?: FakeChannel[];
  createdChannel?: { id: string };
}): CommandInteractionLike["guild"] {
  const byId = options?.byId ?? {};
  const cacheList = options?.cacheList ?? [];
  const createdChannel = options?.createdChannel ?? { id: "trigger-1" };

  return {
    channels: {
      create: vi.fn().mockResolvedValue(createdChannel),
      fetch: vi.fn(async (id: string) => {
        if (Object.prototype.hasOwnProperty.call(byId, id)) {
          return byId[id] ?? null;
        }
        return null;
      }),
      cache: {
        find: vi.fn((predicate: (channel: FakeChannel) => boolean) =>
          cacheList.find(predicate),
        ),
        filter: vi.fn((predicate: (channel: FakeChannel) => boolean) =>
          cacheList.filter(predicate),
        ),
      },
    },
  };
}

// vac-config autocomplete 用 interaction モック
function createAutocompleteInteraction(
  overrides?: Partial<AutocompleteInteractionLike>,
): AutocompleteInteractionLike {
  const categoryA = {
    type: ChannelType.GuildCategory,
    name: "Alpha",
    id: "cat-1",
  };
  const categoryB = {
    type: ChannelType.GuildCategory,
    name: "Beta",
    id: "cat-2",
  };
  const channels = [categoryA, categoryB];

  return {
    commandName: "vac-config",
    guild: {
      id: "guild-1",
      channels: {
        cache: {
          filter: vi.fn((predicate: (channel: unknown) => boolean) =>
            channels.filter(predicate),
          ),
        },
      },
    },
    options: {
      getSubcommand: vi.fn(() => "create-trigger-vc"),
      getFocused: vi.fn(() => "a"),
    },
    respond: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/vac-config", () => {
  // ケース間でモック状態を初期化する
  beforeEach(() => {
    vi.clearAllMocks();
    tGuildMock.mockResolvedValue("translated");
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [],
    });
  });

  // guild 外実行時は共通エラーハンドラへ委譲されることを検証
  it("delegates guild-only error to handleCommandError", async () => {
    const interaction = createCommandInteraction({ guildId: null });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("delegates permission error when ManageGuild is missing", async () => {
    const interaction = createCommandInteraction({
      memberPermissions: { has: vi.fn(() => false) },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("delegates permission error when memberPermissions is undefined", async () => {
    const interaction = createCommandInteraction({
      memberPermissions: undefined as unknown as { has: Mock },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("delegates invalid subcommand error", async () => {
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "unknown"),
        getString: vi.fn(() => null),
      },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // create-trigger-vc 正常系で作成・保存・応答されることを検証
  it("creates trigger voice channel on create-trigger-vc", async () => {
    const interaction = createCommandInteraction();

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
    expect(interaction.guild?.channels.create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: null,
    });
    expect(addTriggerChannelMock).toHaveBeenCalledWith("guild-1", "trigger-1");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: 64,
    });
  });

  it("creates trigger under category resolved from current channel parent", async () => {
    const category = {
      id: "cat-parent",
      type: ChannelType.GuildCategory,
      name: "Parent",
      children: { cache: { size: 1 } },
    };
    const interaction = createCommandInteraction({
      guild: createGuildWithChannels({
        byId: {
          "text-1": {
            id: "text-1",
            type: ChannelType.GuildText,
            parent: category,
          },
        },
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.guild?.channels.create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: "cat-parent",
    });
  });

  it("creates trigger at top when current channel fetch fails", async () => {
    const interaction = createCommandInteraction({
      guild: createGuildWithChannels({
        byId: {},
      }),
    });

    interaction.guild?.channels.fetch.mockRejectedValue(
      new Error("fetch failed"),
    );

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.guild?.channels.create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: null,
    });
  });

  it("creates trigger when category option is TOP", async () => {
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => "TOP"),
      },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.guild?.channels.create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: null,
    });
  });

  it("creates trigger with category option resolved by id", async () => {
    const category = {
      id: "cat-by-id",
      name: "ById",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 1 } },
    };
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => "cat-by-id"),
      },
      guild: createGuildWithChannels({ byId: { "cat-by-id": category } }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.guild?.channels.create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: "cat-by-id",
    });
  });

  it("creates trigger with category option resolved by name", async () => {
    const category = {
      id: "cat-by-name",
      name: "TargetCategory",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 1 } },
    };
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => "targetcategory"),
      },
      guild: createGuildWithChannels({
        byId: { targetcategory: null },
        cacheList: [category],
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.guild?.channels.create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: "cat-by-name",
    });
  });

  it("creates trigger at top when category option does not resolve", async () => {
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => "unknown-category"),
      },
      guild: createGuildWithChannels({
        byId: {
          "unknown-category": {
            id: "unknown-category",
            type: ChannelType.GuildText,
          },
        },
        cacheList: [],
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.guild?.channels.create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: null,
    });
  });

  it("creates trigger when category fetch throws and name fallback misses", async () => {
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => "cat-error"),
      },
      guild: createGuildWithChannels({ byId: {}, cacheList: [] }),
    });

    interaction.guild?.channels.fetch.mockImplementation(async (id: string) => {
      if (id === "cat-error") {
        throw new Error("fetch error");
      }
      return null;
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.guild?.channels.create).toHaveBeenCalledWith({
      name: "CreateVC",
      type: ChannelType.GuildVoice,
      parent: null,
    });
  });

  it("delegates error when trigger already exists in target category", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-existing"],
      createdChannels: [],
    });

    const category = {
      id: "cat-1",
      name: "Cat",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 2 } },
    };

    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => "cat-1"),
      },
      guild: createGuildWithChannels({
        byId: {
          "cat-1": category,
          "tr-existing": {
            id: "tr-existing",
            name: "CreateVC",
            type: ChannelType.GuildVoice,
            parent: category,
          },
        },
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(addTriggerChannelMock).not.toHaveBeenCalled();
  });

  it("treats trigger with non-category parent as top-level existing trigger", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-top"],
      createdChannels: [],
    });

    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => "TOP"),
      },
      guild: createGuildWithChannels({
        byId: {
          "tr-top": {
            id: "tr-top",
            name: "CreateVC",
            type: ChannelType.GuildVoice,
            parent: { id: "text-parent", type: ChannelType.GuildText },
          },
        },
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(interaction.guild?.channels.create).not.toHaveBeenCalled();
  });

  it("delegates error when target category is full", async () => {
    const category = {
      id: "cat-full",
      name: "Full",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 50 } },
    };
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => "cat-full"),
      },
      guild: createGuildWithChannels({ byId: { "cat-full": category } }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(interaction.guild?.channels.create).not.toHaveBeenCalled();
  });

  it("delegates error when create-trigger guild is unexpectedly missing", async () => {
    const interaction = createCommandInteraction({
      guild: null,
      options: {
        getSubcommand: vi.fn(() => "create-trigger-vc"),
        getString: vi.fn(() => null),
      },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("removes trigger channel and deletes voice channel on remove-trigger-vc", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-1"],
      createdChannels: [],
    });

    const category = {
      id: "cat-1",
      name: "Cat",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 1 } },
    };
    const deleteMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getString: vi.fn(() => "cat-1"),
      },
      guild: createGuildWithChannels({
        byId: {
          "cat-1": category,
          "tr-1": {
            id: "tr-1",
            name: "CreateVC",
            type: ChannelType.GuildVoice,
            parent: category,
            delete: deleteMock,
          },
        },
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(removeTriggerChannelMock).toHaveBeenCalledWith("guild-1", "tr-1");
    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: 64,
    });
  });

  it("removes trigger setting even when fetched channel is not voice", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-2"],
      createdChannels: [],
    });

    const category = {
      id: "cat-1",
      name: "Cat",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 1 } },
    };
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getString: vi.fn(() => "cat-1"),
      },
      guild: createGuildWithChannels({
        byId: {
          "cat-1": category,
          "tr-2": {
            id: "tr-2",
            name: "CreateVC",
            type: ChannelType.GuildVoice,
            parent: category,
          },
        },
      }),
    });

    let triggerFetchCount = 0;
    interaction.guild?.channels.fetch.mockImplementation(async (id: string) => {
      if (id === "cat-1") {
        return category;
      }
      if (id === "tr-2") {
        triggerFetchCount += 1;
        if (triggerFetchCount === 1) {
          return {
            id: "tr-2",
            name: "CreateVC",
            type: ChannelType.GuildVoice,
            parent: category,
          };
        }
        return {
          id: "tr-2",
          name: "CreateVC",
          type: ChannelType.GuildText,
          parent: category,
        };
      }
      return null;
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(removeTriggerChannelMock).toHaveBeenCalledWith("guild-1", "tr-2");
    expect(interaction.reply).toHaveBeenCalledTimes(1);
  });

  it("delegates remove error when trigger is not found", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [],
    });

    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getString: vi.fn(() => null),
      },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("delegates remove error when trigger ids exist but channels are invalid", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["invalid-1", "invalid-2"],
      createdChannels: [],
    });

    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getString: vi.fn(() => null),
      },
      guild: createGuildWithChannels({
        byId: {
          "text-1": { id: "text-1", type: ChannelType.GuildText, parent: null },
          "invalid-1": null,
          "invalid-2": { id: "invalid-2", type: ChannelType.GuildText },
        },
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(removeTriggerChannelMock).not.toHaveBeenCalled();
  });

  it("delegates remove error when trigger channels exist but category does not match", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-mismatch"],
      createdChannels: [],
    });

    const targetCategory = {
      id: "cat-target",
      name: "Target",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 1 } },
    };
    const anotherCategory = {
      id: "cat-other",
      name: "Other",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 1 } },
    };

    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getString: vi.fn(() => "cat-target"),
      },
      guild: createGuildWithChannels({
        byId: {
          "cat-target": targetCategory,
          "tr-mismatch": {
            id: "tr-mismatch",
            name: "CreateVC",
            type: ChannelType.GuildVoice,
            parent: anotherCategory,
          },
        },
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(removeTriggerChannelMock).not.toHaveBeenCalled();
  });

  it("delegates remove error when trigger fetch throws during search", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-throw"],
      createdChannels: [],
    });

    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getString: vi.fn(() => null),
      },
      guild: createGuildWithChannels({
        byId: {
          "text-1": { id: "text-1", type: ChannelType.GuildText, parent: null },
        },
      }),
    });

    interaction.guild?.channels.fetch.mockImplementation(async (id: string) => {
      if (id === "text-1") {
        return { id: "text-1", type: ChannelType.GuildText, parent: null };
      }
      if (id === "tr-throw") {
        throw new Error("trigger fetch failed");
      }
      return null;
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("removes trigger setting when deleting actual channel fetch fails", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-err"],
      createdChannels: [],
    });

    const category = {
      id: "cat-err",
      name: "ErrCat",
      type: ChannelType.GuildCategory,
      children: { cache: { size: 1 } },
    };
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getString: vi.fn(() => "cat-err"),
      },
      guild: createGuildWithChannels({
        byId: {
          "cat-err": category,
          "tr-err": {
            id: "tr-err",
            name: "CreateVC",
            type: ChannelType.GuildVoice,
            parent: category,
          },
        },
      }),
    });

    let triggerFetchCount = 0;
    interaction.guild?.channels.fetch.mockImplementation(async (id: string) => {
      if (id === "cat-err") {
        return category;
      }
      if (id === "tr-err") {
        triggerFetchCount += 1;
        if (triggerFetchCount === 1) {
          return {
            id: "tr-err",
            name: "CreateVC",
            type: ChannelType.GuildVoice,
            parent: category,
          };
        }
        throw new Error("fetch failed");
      }
      return null;
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(removeTriggerChannelMock).toHaveBeenCalledWith("guild-1", "tr-err");
    expect(interaction.reply).toHaveBeenCalledTimes(1);
  });

  it("delegates remove error when guild is unexpectedly missing", async () => {
    const interaction = createCommandInteraction({
      guild: null,
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getString: vi.fn(() => null),
      },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("shows configured trigger channels and created channels", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-1", "tr-2"],
      createdChannels: [{ voiceChannelId: "vc-1", ownerId: "user-1" }],
    });

    const category = {
      id: "cat-1",
      name: "Category One",
      type: ChannelType.GuildCategory,
    };
    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getString: vi.fn(() => null),
      },
      guild: createGuildWithChannels({
        byId: {
          "tr-1": {
            id: "tr-1",
            type: ChannelType.GuildVoice,
            parent: category,
          },
          "tr-2": {
            id: "tr-2",
            type: ChannelType.GuildVoice,
            parent: null,
          },
        },
      }),
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(createInfoEmbedMock).toHaveBeenCalledTimes(1);
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [
        expect.objectContaining({
          description: "",
        }),
      ],
      flags: 64,
    });
  });

  it("shows top label for trigger channel when trigger fetch throws", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["tr-fail"],
      createdChannels: [],
    });

    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getString: vi.fn(() => null),
      },
      guild: createGuildWithChannels({ byId: {} }),
    });

    interaction.guild?.channels.fetch.mockRejectedValue(
      new Error("fetch failed"),
    );

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const [, options] = createInfoEmbedMock.mock.calls[0] as [
      string,
      {
        fields: Array<{ value: string }>;
      },
    ];
    expect(options.fields[0].value).toContain("<#tr-fail>");
  });

  it("shows fallback labels when no channels are configured", async () => {
    getVacConfigOrDefaultMock.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [],
    });

    const interaction = createCommandInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getString: vi.fn(() => null),
      },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(createInfoEmbedMock).toHaveBeenCalledTimes(1);
    const [, options] = createInfoEmbedMock.mock.calls[0] as [
      string,
      {
        fields: Array<{ value: string }>;
      },
    ];
    expect(options.fields.length).toBe(2);
  });

  it("delegates view error when guild is unexpectedly missing", async () => {
    const interaction = createCommandInteraction({
      guild: null,
      options: {
        getSubcommand: vi.fn(() => "view"),
        getString: vi.fn(() => null),
      },
    });

    await vacConfigCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  // オートコンプリートで TOP とカテゴリ候補を返すことを検証
  it("responds autocomplete choices with TOP and matching categories", async () => {
    const interaction = createAutocompleteInteraction();

    await vacConfigCommand.autocomplete!(
      interaction as unknown as AutocompleteInteraction,
    );

    expect(interaction.respond).toHaveBeenCalledTimes(1);
    const choices = interaction.respond.mock.calls[0][0] as Array<{
      name: string;
      value: string;
    }>;
    expect(choices.some((choice) => choice.value === "TOP")).toBe(true);
    expect(choices.some((choice) => choice.value === "cat-1")).toBe(true);
  });

  it("responds empty choices when command name does not match", async () => {
    const interaction = createAutocompleteInteraction({ commandName: "other" });

    await vacConfigCommand.autocomplete!(
      interaction as unknown as AutocompleteInteraction,
    );

    expect(interaction.respond).toHaveBeenCalledWith([]);
  });

  it("responds empty choices when subcommand is unsupported", async () => {
    const interaction = createAutocompleteInteraction({
      options: {
        getSubcommand: vi.fn(() => "view"),
        getFocused: vi.fn(() => "a"),
      },
    });

    await vacConfigCommand.autocomplete!(
      interaction as unknown as AutocompleteInteraction,
    );

    expect(interaction.respond).toHaveBeenCalledWith([]);
  });

  it("responds empty choices when guild is missing in autocomplete", async () => {
    const interaction = createAutocompleteInteraction({ guild: null });

    await vacConfigCommand.autocomplete!(
      interaction as unknown as AutocompleteInteraction,
    );

    expect(interaction.respond).toHaveBeenCalledWith([]);
  });

  it("supports remove-trigger-vc autocomplete as valid path", async () => {
    const interaction = createAutocompleteInteraction({
      options: {
        getSubcommand: vi.fn(() => "remove-trigger-vc"),
        getFocused: vi.fn(() => "be"),
      },
    });

    await vacConfigCommand.autocomplete!(
      interaction as unknown as AutocompleteInteraction,
    );

    const choices = interaction.respond.mock.calls[0][0] as Array<{
      name: string;
      value: string;
    }>;
    expect(choices.some((choice) => choice.value === "cat-2")).toBe(true);
  });
});
