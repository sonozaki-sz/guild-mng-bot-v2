import { channelDeleteEvent } from "@/bot/events/channelDelete";
import { ChannelType, Events } from "discord.js";
const handleVacChannelDeleteMock = vi.fn();
const handleStickyMessageChannelDeleteMock = vi.fn();

vi.mock("@/bot/features/vac/handlers/vacChannelDelete", () => ({
  handleVacChannelDelete: (...args: unknown[]) =>
    handleVacChannelDeleteMock(...args),
}));

vi.mock(
  "@/bot/features/sticky-message/handlers/stickyMessageChannelDeleteHandler",
  () => ({
    handleStickyMessageChannelDelete: (...args: unknown[]) =>
      handleStickyMessageChannelDeleteMock(...args),
  }),
);

type ChannelLike = {
  guildId: string;
  id: string;
  type: ChannelType;
  isDMBased: () => boolean;
};

// channelDelete イベント検証に必要な最小チャンネルモック
function createChannel(overrides?: Partial<ChannelLike>): ChannelLike {
  return {
    guildId: "guild-1",
    id: "channel-1",
    type: ChannelType.GuildVoice,
    isDMBased: () => false,
    ...overrides,
  };
}

describe("bot/events/channelDelete", () => {
  // 各ケース前にモック履歴を初期化する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has expected event metadata", () => {
    expect(channelDeleteEvent.name).toBe(Events.ChannelDelete);
    expect(channelDeleteEvent.once).toBe(false);
  });

  // 実処理は VAC ハンドラーへ委譲されることを検証
  it("delegates channel to VAC channel-delete handler", async () => {
    const channel = createChannel({ type: ChannelType.GuildText });

    await channelDeleteEvent.execute(channel as never);

    expect(handleVacChannelDeleteMock).toHaveBeenCalledWith(channel);
  });

  // スティッキーメッセージのクリーンアップハンドラーへ委譲されることを検証
  it("delegates channel to sticky-message channel-delete handler", async () => {
    const channel = createChannel({ type: ChannelType.GuildText });

    await channelDeleteEvent.execute(channel as never);

    expect(handleStickyMessageChannelDeleteMock).toHaveBeenCalledWith(channel);
  });
});
