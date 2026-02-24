// tests/unit/bot/features/sticky-message/commands/usecases/stickyMessageUpdate.test.ts

import { ChannelType, MessageFlags } from "discord.js";

const findByChannelMock = vi.fn();
const showModalMock = vi.fn().mockResolvedValue(undefined);
const tGuildMock = vi.fn(async (_guildId: string, key: string) => `[${key}]`);
const tDefaultMock = vi.fn((_key: string) => "mock text");

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageConfigService: vi.fn(() => ({
    findByChannel: findByChannelMock,
  })),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: tGuildMock,
  tDefault: tDefaultMock,
}));
vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: vi.fn((msg: string) => ({
    type: "warning",
    description: msg,
  })),
  createInfoEmbed: vi.fn((msg: string, opts?: unknown) => ({
    type: "info",
    description: msg,
    ...(opts as object),
  })),
}));

function createInteractionMock({
  channelType = ChannelType.GuildText,
  channelFromOption = null as { id: string; type: ChannelType } | null,
  useEmbed = false,
} = {}) {
  return {
    reply: vi.fn().mockResolvedValue(undefined),
    showModal: showModalMock,
    channel: { id: "current-ch", type: channelType },
    options: {
      getChannel: vi.fn(() => channelFromOption),
      getBoolean: vi.fn(() => useEmbed),
    },
  };
}

describe("bot/features/sticky-message/commands/usecases/stickyMessageUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showModalMock.mockResolvedValue(undefined);
  });

  it("replies with warning when channel is not GuildText", async () => {
    const { handleStickyMessageUpdate } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageUpdate");
    const interaction = createInteractionMock({
      channelType: ChannelType.GuildVoice,
    });

    await handleStickyMessageUpdate(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(findByChannelMock).not.toHaveBeenCalled();
  });

  it("replies with info when no sticky message found", async () => {
    const { handleStickyMessageUpdate } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageUpdate");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock();

    await handleStickyMessageUpdate(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(showModalMock).not.toHaveBeenCalled();
  });

  it("shows plain text update modal when embed is false", async () => {
    const { handleStickyMessageUpdate } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageUpdate");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      content: "Original content",
      embedData: null,
    });
    const interaction = createInteractionMock({ useEmbed: false });

    await handleStickyMessageUpdate(interaction as never, "guild-1");

    expect(showModalMock).toHaveBeenCalled();
    const modal = showModalMock.mock.calls[0][0];
    expect(modal.data.custom_id).toContain("sticky-message:update-modal:");
  });

  it("shows embed update modal when embed is true", async () => {
    const { handleStickyMessageUpdate } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageUpdate");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      content: "Content",
      embedData: JSON.stringify({
        title: "T",
        description: "D",
        color: 0xff0000,
      }),
    });
    const interaction = createInteractionMock({ useEmbed: true });

    await handleStickyMessageUpdate(interaction as never, "guild-1");

    expect(showModalMock).toHaveBeenCalled();
    const modal = showModalMock.mock.calls[0][0];
    expect(modal.data.custom_id).toContain(
      "sticky-message:update-embed-modal:",
    );
  });

  it("shows embed modal with empty prev data when embedData is null but embed=true", async () => {
    const { handleStickyMessageUpdate } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageUpdate");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      content: "Content",
      embedData: null,
    });
    const interaction = createInteractionMock({ useEmbed: true });

    await handleStickyMessageUpdate(interaction as never, "guild-1");

    expect(showModalMock).toHaveBeenCalled();
  });

  it("shows plain text update modal when getBoolean returns null (null-coalescing fallback)", async () => {
    const { handleStickyMessageUpdate } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageUpdate");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      content: "Original content",
      embedData: null,
    });
    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
      showModal: showModalMock,
      channel: { id: "current-ch", type: ChannelType.GuildText },
      options: {
        getChannel: vi.fn(() => null),
        getBoolean: vi.fn(() => null),
      },
    };

    await handleStickyMessageUpdate(interaction as never, "guild-1");

    expect(showModalMock).toHaveBeenCalled();
    const modal = showModalMock.mock.calls[0][0];
    expect(modal.data.custom_id).toContain("sticky-message:update-modal:");
  });

  it("replies with warning for non-text channel option", async () => {
    const { handleStickyMessageUpdate } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageUpdate");
    const interaction = createInteractionMock({
      channelFromOption: { id: "voice-ch", type: ChannelType.GuildVoice },
    });

    await handleStickyMessageUpdate(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalled();
  });
});
