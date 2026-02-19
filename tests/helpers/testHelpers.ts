/**
 * Test Helpers
 * テスト用のヘルパー関数とモック
 */

import type {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  TextChannel,
  User,
} from "discord.js";

// ============================================================
// Discord.js モック生成ヘルパー
// ============================================================

/**
 * モックユーザーの作成
 */
export const createMockUser = (overrides?: Partial<User>): jest.Mocked<User> =>
  ({
    id: "123456789",
    username: "testuser",
    discriminator: "0001",
    bot: false,
    tag: "testuser#0001",
    ...overrides,
  }) as jest.Mocked<User>;

/**
 * モックギルドの作成
 */
export const createMockGuild = (
  overrides?: Partial<Guild>,
): jest.Mocked<Guild> =>
  ({
    id: "987654321",
    name: "Test Guild",
    ownerId: "123456789",
    ...overrides,
  }) as jest.Mocked<Guild>;

/**
 * モックメンバーの作成
 */
export const createMockMember = (
  overrides?: Partial<GuildMember>,
): jest.Mocked<GuildMember> =>
  ({
    id: "123456789",
    user: createMockUser(),
    guild: createMockGuild(),
    roles: {
      cache: new Map(),
      add: jest.fn(),
      remove: jest.fn(),
    },
    permissions: {
      has: jest.fn().mockReturnValue(true),
    },
    ...overrides,
  }) as unknown as jest.Mocked<GuildMember>;

/**
 * モックテキストチャンネルの作成
 */
export const createMockTextChannel = (
  overrides?: Partial<TextChannel>,
): jest.Mocked<TextChannel> =>
  ({
    id: "111222333",
    name: "test-channel",
    type: 0, // GUILD_TEXT
    send: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as unknown as jest.Mocked<TextChannel>;

/**
 * モックインタラクションの作成
 */
export const createMockInteraction = (
  overrides?: Partial<ChatInputCommandInteraction>,
): jest.Mocked<ChatInputCommandInteraction> =>
  ({
    id: "interaction-123",
    commandName: "test",
    user: createMockUser(),
    guild: createMockGuild(),
    member: createMockMember(),
    channel: createMockTextChannel(),
    replied: false,
    deferred: false,
    ephemeral: false,
    reply: jest.fn().mockResolvedValue(undefined),
    editReply: jest.fn().mockResolvedValue(undefined),
    deferReply: jest.fn().mockResolvedValue(undefined),
    followUp: jest.fn().mockResolvedValue(undefined),
    options: {
      getString: jest.fn(),
      getInteger: jest.fn(),
      getBoolean: jest.fn(),
      getUser: jest.fn(),
      getChannel: jest.fn(),
      getRole: jest.fn(),
      getMember: jest.fn(),
      getSubcommand: jest.fn(),
      getSubcommandGroup: jest.fn(),
    },
    ...overrides,
  }) as unknown as jest.Mocked<ChatInputCommandInteraction>;

// ============================================================
// 汎用ユーティリティ
// ============================================================

/**
 * 非同期処理の待機ヘルパー
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * ランダムなDiscord IDを生成
 */
export const generateSnowflake = (): string => {
  const timestamp = Date.now() - 1420070400000; // Discord epoch
  const random = Math.floor(Math.random() * 4096);
  return ((BigInt(timestamp) << 22n) | BigInt(random)).toString();
};

// ============================================================
// テストデータ生成ヘルパー
// ============================================================

/**
 * テストデータベース用のギルド設定を作成
 */
export const createTestGuildConfig = (guildId: string) => ({
  guildId,
  locale: "ja",
  afkConfig: null,
  vacConfig: null,
  bumpReminderConfig: null,
  stickMessages: null,
  memberLogConfig: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * エラーをアサートするヘルパー
 */
export const expectError = async <T extends Error>(
  fn: () => Promise<unknown>,
  errorClass: new (...args: unknown[]) => T,
  message?: string,
): Promise<void> => {
  try {
    await fn();
    throw new Error(
      `Expected ${errorClass.name} to be thrown, but function resolved successfully`,
    );
  } catch (error) {
    // エラー型を検証
    expect(error).toBeInstanceOf(errorClass);

    // 必要に応じて同一エラーのメッセージも検証
    if (message) {
      const actualMessage =
        error instanceof Error ? error.message : String(error);
      expect(actualMessage).toContain(message);
    }
  }
};
