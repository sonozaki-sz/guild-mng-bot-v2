import { pingCommand } from "@/bot/commands/ping";
import { interactionCreateEvent } from "@/bot/events/interactionCreate";
import type { ChatInputCommandInteraction } from "discord.js";

// コマンド・イベント結合検証のため、翻訳とEmbed生成のみ固定化する
jest.mock("@/shared/locale/commandLocalizations", () => ({
  getCommandLocalizations: () => ({
    ja: "ping description",
    localizations: { "en-US": "ping description" },
  }),
}));
jest.mock("@/shared/locale/localeManager", () => ({
  tDefault: jest.fn((key: string) => key),
  tGuild: jest.fn(
    async (
      _guildId: string | undefined,
      key: string,
      params?: Record<string, unknown>,
    ) => {
      if (key === "commands:ping.embed.measuring") {
        return "🏓 計測中...";
      }
      if (key === "commands:ping.embed.response") {
        return `📡 API レイテンシー: **${String(params?.apiLatency)}ms**\n💓 WebSocket Ping: **${String(params?.wsLatency)}ms**`;
      }
      return key;
    },
  ),
}));
jest.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: jest.fn(),
  handleInteractionError: jest.fn(),
}));
jest.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: jest.fn((description: string) => ({ description })),
}));
jest.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

type CommandInteraction = {
  client: {
    commands: Map<string, unknown>;
    cooldownManager: { check: jest.Mock };
    modals: Map<string, unknown>;
    ws: { ping: number };
  };
  commandName: string;
  guildId: string;
  createdTimestamp: number;
  user: { id: string; tag: string };
  reply: jest.Mock<Promise<void>, [unknown]>;
  fetchReply: jest.Mock<Promise<{ createdTimestamp: number }>, []>;
  editReply: jest.Mock<Promise<void>, [unknown]>;
  isChatInputCommand: jest.Mock<boolean, []>;
  isAutocomplete: jest.Mock<boolean, []>;
  isModalSubmit: jest.Mock<boolean, []>;
  isButton: jest.Mock<boolean, []>;
  isUserSelectMenu: jest.Mock<boolean, []>;
};

// ChatInput 経路の統合検証に必要な最小 interaction を組み立てる
function createInteraction(): CommandInteraction {
  return {
    client: {
      commands: new Map([["ping", pingCommand]]),
      cooldownManager: { check: jest.fn(() => 0) },
      modals: new Map(),
      ws: { ping: 42 },
    },
    commandName: "ping",
    guildId: "guild-1",
    createdTimestamp: 1_000,
    user: { id: "user-1", tag: "user#0001" },
    reply: jest.fn().mockResolvedValue(undefined),
    fetchReply: jest.fn().mockResolvedValue({ createdTimestamp: 1_123 }),
    editReply: jest.fn().mockResolvedValue(undefined),
    isChatInputCommand: jest.fn(() => true),
    isAutocomplete: jest.fn(() => false),
    isModalSubmit: jest.fn(() => false),
    isButton: jest.fn(() => false),
    isUserSelectMenu: jest.fn(() => false),
  };
}

describe("integration: interactionCreate + pingCommand", () => {
  // 各ケースの検証前にモック履歴をリセットする
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // interactionCreate から pingCommand までの実行経路を統合的に確認する
  it("dispatches chat command through event and returns latency embed", async () => {
    const interaction = createInteraction();

    await interactionCreateEvent.execute(
      interaction as unknown as ChatInputCommandInteraction,
    );

    expect(interaction.client.cooldownManager.check).toHaveBeenCalledWith(
      "ping",
      "user-1",
      5,
    );
    expect(interaction.reply).toHaveBeenCalledWith({ content: "🏓 計測中..." });
    expect(interaction.fetchReply).toHaveBeenCalledTimes(1);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "",
      embeds: [
        {
          description:
            "📡 API レイテンシー: **123ms**\n💓 WebSocket Ping: **42ms**",
        },
      ],
    });
  });
});
