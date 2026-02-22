// tests/unit/bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler.test.ts

import { handleStickyMessageChannelDelete } from "@/bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler";
import { ChannelType } from "discord.js";

const cancelTimerMock = vi.fn();
const deleteByChannelMock = vi.fn();

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageResendService: vi.fn(() => ({
    cancelTimer: cancelTimerMock,
  })),
  getBotStickyMessageConfigService: vi.fn(() => ({
    deleteByChannel: deleteByChannelMock,
  })),
}));

describe("bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels timer and deletes DB record for GuildText channel", async () => {
    const channel = { id: "ch-1", type: ChannelType.GuildText };

    await handleStickyMessageChannelDelete(channel as never);

    expect(cancelTimerMock).toHaveBeenCalledWith("ch-1");
    expect(deleteByChannelMock).toHaveBeenCalledWith("ch-1");
  });

  it("skips non-text channels (e.g. GuildVoice)", async () => {
    const channel = { id: "vc-1", type: ChannelType.GuildVoice };

    await handleStickyMessageChannelDelete(channel as never);

    expect(cancelTimerMock).not.toHaveBeenCalled();
    expect(deleteByChannelMock).not.toHaveBeenCalled();
  });

  it("swallows DB errors without rethrowing", async () => {
    deleteByChannelMock.mockRejectedValueOnce(new Error("db error"));
    const channel = { id: "ch-2", type: ChannelType.GuildText };

    // エラーが外に伝播しないこと
    await expect(
      handleStickyMessageChannelDelete(channel as never),
    ).resolves.toBeUndefined();

    expect(cancelTimerMock).toHaveBeenCalledWith("ch-2");
  });
});
