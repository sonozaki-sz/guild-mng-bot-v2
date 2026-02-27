// tests/unit/bot/features/sticky-message/commands/usecases/stickyMessageRemove.test.ts

import { ChannelType, MessageFlags } from "discord.js";

const findByChannelMock = vi.fn();
const deleteMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => `[${key}]`);

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageConfigService: vi.fn(() => ({
    findByChannel: findByChannelMock,
    delete: deleteMock,
  })),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: tGuildMock,
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: vi.fn((msg: string) => ({
    type: "warning",
    description: msg,
  })),
  createInfoEmbed: vi.fn((msg: string, opts?: object) => ({
    type: "info",
    description: msg,
    ...opts,
  })),
  createSuccessEmbed: vi.fn((msg: string, opts?: object) => ({
    type: "success",
    description: msg,
    ...opts,
  })),
}));

function createInteractionMock({
  channelType = ChannelType.GuildText,
  guildChannels = true,
  deleteMsgSuccess = true,
}: {
  channelType?: ChannelType;
  lastMessageId?: string | null;
  guildChannels?: boolean;
  deleteMsgSuccess?: boolean;
} = {}) {
  const replyMock = vi.fn().mockResolvedValue(undefined);
  const msgDeleteMock = vi.fn();
  if (!deleteMsgSuccess) {
    msgDeleteMock.mockRejectedValue(new Error("Not found"));
  } else {
    msgDeleteMock.mockResolvedValue(undefined);
  }
  const fetchMsgMock = vi.fn().mockResolvedValue({ delete: msgDeleteMock });
  return {
    reply: replyMock,
    options: {
      getChannel: vi.fn((_name: string, _required: boolean) => ({
        id: "ch-1",
        type: channelType,
      })),
    },
    guild: guildChannels
      ? {
          channels: {
            cache: new Map([["ch-1", { messages: { fetch: fetchMsgMock } }]]),
          },
        }
      : null,
    _replyMock: replyMock,
    _msgDeleteMock: msgDeleteMock,
    _fetchMsgMock: fetchMsgMock,
  };
}

// スティッキーメッセージの削除ユースケースを検証する。DB記録削除とDiscordメッセージ削除の協調動作、および各エラーケースの耐性を確認する
describe("bot/features/sticky-message/commands/usecases/stickyMessageRemove", () => {
  // deleteMockのデフォルト成功値を設定し、テスト間のモック状態汚染を防ぐ
  beforeEach(() => {
    vi.clearAllMocks();
    deleteMock.mockResolvedValue(undefined);
  });

  it("replies with warning when channel is not a GuildText", async () => {
    const { handleStickyMessageRemove } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageRemove");
    const interaction = createInteractionMock({
      channelType: ChannelType.GuildVoice,
    });

    await handleStickyMessageRemove(interaction as never, "guild-1");

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(findByChannelMock).not.toHaveBeenCalled();
  });

  it("replies with info when no sticky message found", async () => {
    const { handleStickyMessageRemove } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageRemove");
    findByChannelMock.mockResolvedValue(null);
    const interaction = createInteractionMock();

    await handleStickyMessageRemove(interaction as never, "guild-1");

    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });

  // DBレコード削除とDiscordの投稿削除が両方呼ばれ、成功返信が送られる正常系フロー全体を確認する
  it("deletes existing sticky message and replies with success", async () => {
    const { handleStickyMessageRemove } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageRemove");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "msg-1",
    });
    const interaction = createInteractionMock({ lastMessageId: "msg-1" });

    await handleStickyMessageRemove(interaction as never, "guild-1");

    expect(interaction._fetchMsgMock).toHaveBeenCalledWith("msg-1");
    expect(interaction._msgDeleteMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledWith("sticky-1");
    expect(interaction._replyMock).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  it("skips message deletion when no lastMessageId", async () => {
    const { handleStickyMessageRemove } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageRemove");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: null,
    });
    const interaction = createInteractionMock();

    await handleStickyMessageRemove(interaction as never, "guild-1");

    expect(deleteMock).toHaveBeenCalledWith("sticky-1");
    expect(interaction._replyMock).toHaveBeenCalled();
  });

  // Discordのメッセージが既に削除済み等で取得・削除に失敗しても、DBレコード削除は続行されエラーが上位に伝播しないことを確認する
  it("ignores error when fetching/deleting previous message fails", async () => {
    const { handleStickyMessageRemove } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageRemove");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "gone-msg",
    });
    const interaction = createInteractionMock({
      lastMessageId: "gone-msg",
      deleteMsgSuccess: false,
    });

    await expect(
      handleStickyMessageRemove(interaction as never, "guild-1"),
    ).resolves.not.toThrow();
    expect(deleteMock).toHaveBeenCalledWith("sticky-1");
  });

  // guildチャンネルキャッシュに対象チャンネルがない場合でも、DBのスティッキー設定は正常に削除されることを確認する
  it("skips delete when guild channels cache has no channel", async () => {
    const { handleStickyMessageRemove } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageRemove");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      lastMessageId: "msg-1",
    });
    const interaction = createInteractionMock({ guildChannels: false });

    await handleStickyMessageRemove(interaction as never, "guild-1");

    expect(deleteMock).toHaveBeenCalledWith("sticky-1");
  });
});
