// tests/unit/bot/features/sticky-message/commands/usecases/stickyMessageSet.test.ts

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
}));

function createInteractionMock({
  channelType = ChannelType.GuildText,
  channelFromOption = null as { id: string; type: ChannelType } | null,
  useEmbed = false,
  replyMock = vi.fn().mockResolvedValue(undefined),
}: {
  channelType?: ChannelType;
  channelFromOption?: { id: string; type: ChannelType } | null;
  useEmbed?: boolean;
  replyMock?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    reply: replyMock,
    showModal: showModalMock,
    channel: { id: "current-ch", type: channelType },
    options: {
      getChannel: vi.fn(
        (_name: string, _required: boolean) => channelFromOption,
      ),
      getString: vi.fn((_name: string) => (useEmbed ? "embed" : null)),
    },
    _replyMock: replyMock,
  };
}

describe("bot/features/sticky-message/commands/usecases/stickyMessageSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    showModalMock.mockResolvedValue(undefined);
  });

  it("replies with warning when channel is not GuildText", async () => {
    const { handleStickyMessageSet } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageSet");
    const interaction = createInteractionMock({
      channelType: ChannelType.GuildVoice,
    });

    await handleStickyMessageSet(interaction as never, "guild-1");

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(findByChannelMock).not.toHaveBeenCalled();
  });

  it("replies with warning when user specifies non-text channel option", async () => {
    const { handleStickyMessageSet } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageSet");
    const interaction = createInteractionMock({
      channelFromOption: { id: "voice-ch", type: ChannelType.GuildVoice },
    });

    await handleStickyMessageSet(interaction as never, "guild-1");

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  it("replies with warning when sticky already exists", async () => {
    const { handleStickyMessageSet } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageSet");
    findByChannelMock.mockResolvedValue({ id: "existing" });
    const interaction = createInteractionMock();

    await handleStickyMessageSet(interaction as never, "guild-1");

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(showModalMock).not.toHaveBeenCalled();
  });

  it("shows plain text modal when embed is false", async () => {
    const { handleStickyMessageSet } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageSet");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock({ useEmbed: false });

    await handleStickyMessageSet(interaction as never, "guild-1");

    expect(showModalMock).toHaveBeenCalled();
    const modal = showModalMock.mock.calls[0][0];
    // Check that modal uses SET_MODAL_ID_PREFIX
    expect(modal.data.custom_id).toContain("sticky-message:set-modal:");
  });

  it("shows embed modal when embed is true", async () => {
    const { handleStickyMessageSet } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageSet");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock({ useEmbed: true });

    await handleStickyMessageSet(interaction as never, "guild-1");

    expect(showModalMock).toHaveBeenCalled();
    const modal = showModalMock.mock.calls[0][0];
    expect(modal.data.custom_id).toContain("sticky-message:set-embed-modal:");
  });

  it("uses channelOption when provided", async () => {
    const { handleStickyMessageSet } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageSet");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock({
      channelFromOption: { id: "specific-ch", type: ChannelType.GuildText },
    });

    await handleStickyMessageSet(interaction as never, "guild-1");

    expect(findByChannelMock).toHaveBeenCalledWith("specific-ch");
  });

  it("replies with warning when no channel is available (channel is null)", async () => {
    const { handleStickyMessageSet } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageSet");
    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
      showModal: showModalMock,
      channel: null, // no current channel
      options: {
        getChannel: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    };

    await handleStickyMessageSet(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  it("shows plain text modal when getString returns null (defaults to text style)", async () => {
    const { handleStickyMessageSet } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageSet");
    findByChannelMock.mockResolvedValue(null);
    // getBoolean returns null triggers the ?? false branch
    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
      showModal: showModalMock,
      channel: { id: "current-ch", type: ChannelType.GuildText },
      options: {
        getChannel: vi.fn(() => null),
        getString: vi.fn(() => null),
      },
    };

    await handleStickyMessageSet(interaction as never, "guild-1");

    expect(showModalMock).toHaveBeenCalled();
    const modal = showModalMock.mock.calls[0][0];
    expect(modal.data.custom_id).toContain("sticky-message:set-modal:");
  });
});
