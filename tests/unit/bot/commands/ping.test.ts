import type { Mock } from "vitest";
import { pingCommand } from "@/bot/commands/ping";
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";
import { tGuild } from "@/shared/locale/localeManager";
import type { ChatInputCommandInteraction } from "discord.js";

// Ping コマンドが依存する外部モジュールをモック化して、処理分岐に集中する
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));
vi.mock("@/shared/locale/commandLocalizations", () => ({
  getCommandLocalizations: () => ({
    ja: "ping description",
    localizations: { "en-US": "ping description" },
  }),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(),
}));
vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: vi.fn((description: string) => ({ description })),
}));

type MockInteraction = {
  guildId: string;
  createdTimestamp: number;
  user: { id: string; tag: string };
  client: { ws: { ping: number } };
  reply: Mock<(arg: unknown) => Promise<void>>;
  fetchReply: Mock<() => Promise<{ createdTimestamp: number }>>;
  editReply: Mock<(arg: unknown) => Promise<void>>;
};

// Ping コマンド向けの最小 interaction モックを生成する
function createInteraction(
  overrides?: Partial<MockInteraction>,
): MockInteraction {
  return {
    guildId: "guild-1",
    createdTimestamp: 1_000,
    user: { id: "user-1", tag: "user#0001" },
    client: { ws: { ping: 42 } },
    reply: vi.fn().mockResolvedValue(undefined),
    fetchReply: vi.fn().mockResolvedValue({ createdTimestamp: 1_130 }),
    editReply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("bot/commands/ping", () => {
  // 各テストでモック呼び出し履歴を初期化して相互干渉を防ぐ
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 正常系として measuring→fetchReply→embed 更新の一連処理を確認する
  it("replies with measuring message and edits reply with latency embed", async () => {
    const interaction = createInteraction();

    (tGuild as Mock)
      .mockResolvedValueOnce("計測中...")
      .mockResolvedValueOnce("API: 130ms / WS: 42ms");

    await pingCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.reply).toHaveBeenCalledWith({ content: "計測中..." });
    expect(interaction.fetchReply).toHaveBeenCalledTimes(1);
    expect(createSuccessEmbed).toHaveBeenCalledWith("API: 130ms / WS: 42ms");
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "",
      embeds: [{ description: "API: 130ms / WS: 42ms" }],
    });
  });

  // guildId が null の場合も undefined として翻訳呼び出しされることを検証
  it("handles null guildId by passing undefined to translation", async () => {
    const interaction = createInteraction({
      guildId: null as unknown as string,
    });

    (tGuild as Mock)
      .mockResolvedValueOnce("計測中...")
      .mockResolvedValueOnce("API: 130ms / WS: 42ms");

    await pingCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(tGuild).toHaveBeenNthCalledWith(
      1,
      undefined,
      "commands:ping.embed.measuring",
    );
    expect(tGuild).toHaveBeenNthCalledWith(
      2,
      undefined,
      "commands:ping.embed.response",
      { apiLatency: 130, wsLatency: 42 },
    );
  });

  // 例外発生時は統一エラーハンドラへ委譲することを確認する
  it("delegates error to handleCommandError when reply fails", async () => {
    const error = new Error("reply failed");
    const interaction = createInteraction({
      reply: vi.fn().mockRejectedValue(error),
    });

    (tGuild as Mock).mockResolvedValue("計測中...");

    await pingCommand.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(handleCommandError).toHaveBeenCalledWith(interaction, error);
  });
});
