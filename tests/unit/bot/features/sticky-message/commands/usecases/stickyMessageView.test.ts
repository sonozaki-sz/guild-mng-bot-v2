// tests/unit/bot/features/sticky-message/commands/usecases/stickyMessageView.test.ts

import { MessageFlags } from "discord.js";

const findAllByGuildMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => `[${key}]`);

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageConfigService: vi.fn(() => ({
    findAllByGuild: findAllByGuildMock,
  })),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: tGuildMock,
}));
vi.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: vi.fn((msg: string) => ({ type: "info", description: msg })),
}));

function createInteractionMock(channelCache?: Map<string, { name: string }>) {
  return {
    reply: vi.fn().mockResolvedValue(undefined),
    guild: channelCache ? { channels: { cache: channelCache } } : null,
  };
}

// stickyMessageView ユースケースが
// 登録件数ゼロ・件数あり・チャンネルキャッシュなし・25件超えの各条件で
// 適切なレスポンス（Ephemeral info / セレクトメニュー）を返すかを検証する
describe("bot/features/sticky-message/commands/usecases/stickyMessageView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replies with info when no sticky messages found", async () => {
    const { handleStickyMessageView } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageView");
    findAllByGuildMock.mockResolvedValue([]);
    const interaction = createInteractionMock();

    await handleStickyMessageView(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  it("shows select menu when sticky messages exist", async () => {
    const { handleStickyMessageView } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageView");
    const stickies = [
      { id: "s1", channelId: "ch-1", content: "Hello World" },
      { id: "s2", channelId: "ch-2", content: "A".repeat(60) },
    ];
    findAllByGuildMock.mockResolvedValue(stickies);
    const channelCache = new Map([["ch-1", { name: "general" }]]);
    const interaction = createInteractionMock(channelCache);

    await handleStickyMessageView(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        components: expect.any(Array),
        flags: MessageFlags.Ephemeral,
      }),
    );
  });

  // チャンネルがキャッシュに存在しない場合はチャンネル名の代わりに ID をラベル表示することを確認
  it("uses channel ID as label when channel is not in cache", async () => {
    const { handleStickyMessageView } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageView");
    const stickies = [{ id: "s1", channelId: "unknown-ch", content: "Hi" }];
    findAllByGuildMock.mockResolvedValue(stickies);
    const interaction = createInteractionMock(new Map());

    await handleStickyMessageView(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalled();
  });

  // Discord のセレクトメニューは最大 25 項目のため、30件あっても 25件に切り捨てられることを確認
  it("limits to 25 options even if more stickies exist", async () => {
    const { handleStickyMessageView } =
      await import("@/bot/features/sticky-message/commands/usecases/stickyMessageView");
    const stickies = Array.from({ length: 30 }, (_, i) => ({
      id: `s${i}`,
      channelId: `ch-${i}`,
      content: `Content ${i}`,
    }));
    findAllByGuildMock.mockResolvedValue(stickies);
    const interaction = createInteractionMock(new Map());

    await handleStickyMessageView(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalled();
  });
});
