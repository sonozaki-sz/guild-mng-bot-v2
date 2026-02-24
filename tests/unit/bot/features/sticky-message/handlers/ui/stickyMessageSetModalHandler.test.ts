// tests/unit/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler.test.ts

import { MessageFlags } from "discord.js";

const findByChannelMock = vi.fn();
const createMock = vi.fn();
const updateLastMessageIdMock = vi.fn();
const buildPayloadMock = vi.fn(() => ({ content: "sticky" }));
const tGuildMock = vi.fn(async (_guildId: string, key: string) => `[${key}]`);
const loggerMock = { error: vi.fn() };

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageConfigService: vi.fn(() => ({
    findByChannel: findByChannelMock,
    create: createMock,
    updateLastMessageId: updateLastMessageIdMock,
  })),
}));
vi.mock(
  "@/bot/features/sticky-message/services/stickyMessagePayloadBuilder",
  () => ({ buildStickyMessagePayload: buildPayloadMock }),
);
vi.mock("@/shared/locale/localeManager", () => ({ tGuild: tGuildMock }));
vi.mock("@/shared/utils/logger", () => ({ logger: loggerMock }));
vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: vi.fn((msg: string) => ({ type: "warning", msg })),
  createSuccessEmbed: vi.fn((msg: string, opts?: unknown) => ({
    type: "success",
    msg,
    ...(opts as object),
  })),
}));

function createInteractionMock({
  guildId = "guild-1",
  guild = true,
  customId = "sticky-message:set-modal:ch-1",
  contentValue = "Some content",
  channelInCache = true,
  sendResult = { id: "new-msg-id" },
}: {
  guildId?: string;
  guild?: boolean;
  customId?: string;
  contentValue?: string;
  channelInCache?: boolean;
  sendResult?: unknown;
} = {}) {
  const replyMock = vi.fn().mockResolvedValue(undefined);
  const sendMock = vi.fn().mockResolvedValue(sendResult);
  const textChannel = channelInCache ? { send: sendMock } : null;
  return {
    customId,
    reply: replyMock,
    guild: guild
      ? {
          id: guildId,
          channels: { cache: new Map([["ch-1", textChannel]]) },
        }
      : null,
    fields: { getTextInputValue: vi.fn(() => contentValue) },
    user: { id: "user-1" },
    _replyMock: replyMock,
    _sendMock: sendMock,
  };
}

describe("bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue({ id: "sticky-1" });
    updateLastMessageIdMock.mockResolvedValue(undefined);
  });

  it("matches SET_MODAL_ID_PREFIX", async () => {
    const { stickyMessageSetModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler");
    expect(
      stickyMessageSetModalHandler.matches("sticky-message:set-modal:ch-abc"),
    ).toBe(true);
    expect(
      stickyMessageSetModalHandler.matches(
        "sticky-message:set-embed-modal:ch-abc",
      ),
    ).toBe(false);
    expect(stickyMessageSetModalHandler.matches("other-custom-id")).toBe(false);
  });

  it("returns early when no guild", async () => {
    const { stickyMessageSetModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler");
    const interaction = createInteractionMock({ guild: false });

    await stickyMessageSetModalHandler.execute(interaction as never);

    expect(interaction._replyMock).not.toHaveBeenCalled();
  });

  it("replies with warning when content is empty", async () => {
    const { stickyMessageSetModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler");
    const interaction = createInteractionMock({ contentValue: "   " });

    await stickyMessageSetModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("replies with warning when sticky already exists (race condition)", async () => {
    const { stickyMessageSetModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler");
    findByChannelMock.mockResolvedValue({ id: "existing" });
    const interaction = createInteractionMock();

    await stickyMessageSetModalHandler.execute(interaction as never);

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("throws ValidationError when channel not found in cache", async () => {
    const { stickyMessageSetModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock({ channelInCache: false });

    await expect(
      stickyMessageSetModalHandler.execute(interaction as never),
    ).rejects.toThrow();
  });

  it("creates sticky message and replies with success", async () => {
    const { stickyMessageSetModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock({ contentValue: "Hello World" });

    await stickyMessageSetModalHandler.execute(interaction as never);

    expect(createMock).toHaveBeenCalledWith(
      "guild-1",
      "ch-1",
      "Hello World",
      undefined,
      "user-1",
    );
    expect(interaction._sendMock).toHaveBeenCalled();
    expect(updateLastMessageIdMock).toHaveBeenCalledWith(
      "sticky-1",
      "new-msg-id",
    );
    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  it("rethrows error when create fails", async () => {
    const { stickyMessageSetModalHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler");
    findByChannelMock.mockResolvedValue(null);
    createMock.mockRejectedValue(new Error("DB error"));
    const interaction = createInteractionMock();

    await expect(
      stickyMessageSetModalHandler.execute(interaction as never),
    ).rejects.toThrow("DB error");
    expect(loggerMock.error).toHaveBeenCalled();
  });
});
