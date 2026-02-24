// tests/unit/bot/features/sticky-message/handlers/stickyMessageCreateHandler.test.ts

import { ChannelType } from "discord.js";

const handleMessageCreateMock = vi.fn();
const loggerMock = { error: vi.fn() };

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageResendService: vi.fn(() => ({
    handleMessageCreate: handleMessageCreateMock,
  })),
}));

vi.mock("@/shared/utils/logger", () => ({ logger: loggerMock }));

function createMessageMock(
  overrides: Partial<{
    author: { bot: boolean };
    guildId: string | null;
    channelId: string;
    channel: { type: ChannelType };
  }> = {},
) {
  return {
    author: { bot: false },
    guildId: "guild-1",
    channelId: "channel-1",
    channel: { type: ChannelType.GuildText },
    ...overrides,
  };
}

describe("bot/features/sticky-message/handlers/stickyMessageCreateHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls resend service for guild text channel messages", async () => {
    const { handleStickyMessageCreate } = await import(
      "@/bot/features/sticky-message/handlers/stickyMessageCreate" + "Handler"
    );
    const message = createMessageMock();

    await handleStickyMessageCreate(message as never);

    expect(handleMessageCreateMock).toHaveBeenCalledWith(
      message.channel,
      "guild-1",
    );
  });

  it("ignores bot messages", async () => {
    const { handleStickyMessageCreate } =
      await import("@/bot/features/sticky-message/handlers/stickyMessageCreateHandler");
    const message = createMessageMock({ author: { bot: true } });

    await handleStickyMessageCreate(message as never);

    expect(handleMessageCreateMock).not.toHaveBeenCalled();
  });

  it("ignores messages without guildId (DMs)", async () => {
    const { handleStickyMessageCreate } =
      await import("@/bot/features/sticky-message/handlers/stickyMessageCreateHandler");
    const message = createMessageMock({ guildId: null });

    await handleStickyMessageCreate(message as never);

    expect(handleMessageCreateMock).not.toHaveBeenCalled();
  });

  it("ignores non-text channels", async () => {
    const { handleStickyMessageCreate } =
      await import("@/bot/features/sticky-message/handlers/stickyMessageCreateHandler");
    const message = createMessageMock({
      channel: { type: ChannelType.GuildVoice },
    });

    await handleStickyMessageCreate(message as never);

    expect(handleMessageCreateMock).not.toHaveBeenCalled();
  });

  it("logs error when resend service throws", async () => {
    const { handleStickyMessageCreate } =
      await import("@/bot/features/sticky-message/handlers/stickyMessageCreateHandler");
    handleMessageCreateMock.mockRejectedValueOnce(new Error("resend error"));
    const message = createMessageMock();

    await handleStickyMessageCreate(message as never);

    expect(loggerMock.error).toHaveBeenCalledWith(
      "StickyMessage handleMessageCreate error",
      expect.objectContaining({ channelId: "channel-1" }),
    );
  });
});
