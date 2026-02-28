// tests/unit/bot/features/member-log/handlers/guildMemberAddHandler.test.ts
import { ChannelType } from "discord.js";

// discord.js は static import のため vi.mock factory がホイスト時点で実行される
// EmbedBuilderMock は vi.hoisted() で定義して TDZ を回避する
const { EmbedBuilderMock, embedInstance } = vi.hoisted(() => {
  const embedInstance = {
    setColor: vi.fn().mockReturnThis(),
    setTitle: vi.fn().mockReturnThis(),
    setThumbnail: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
    setFooter: vi.fn().mockReturnThis(),
    setTimestamp: vi.fn().mockReturnThis(),
  };
  // アロー関数ではなく通常関数を使用: new EmbedBuilder() で呼ばれる場合、
  // アロー関数はコンストラクタとして使えず TypeError になるため
  const EmbedBuilderMock = vi.fn(function () {
    return embedInstance;
  });
  return { EmbedBuilderMock, embedInstance };
});

// ---- モック定義 ----
const getMemberLogConfigMock = vi.fn();
const getBotMemberLogConfigServiceMock = vi.fn(() => ({
  getMemberLogConfig: getMemberLogConfigMock,
}));

const tDefaultMock = vi.fn(
  (key: string, _opts?: Record<string, unknown>) => key,
);
const tGuildMock = vi.fn(async (key: string) => key);
const getGuildTranslatorMock = vi.fn(async () => tGuildMock);

const loggerMock = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const calcDurationMock = vi.fn(() => ({ years: 5, months: 3, days: 7 }));

vi.mock("@/bot/services/botMemberLogDependencyResolver", () => ({
  getBotMemberLogConfigService: () => getBotMemberLogConfigServiceMock(),
}));
vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string, opts?: Record<string, unknown>) =>
    tDefaultMock(key, opts),
}));
vi.mock("@/shared/locale/helpers", () => ({
  getGuildTranslator: (guildId: string) => getGuildTranslatorMock(guildId),
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: loggerMock,
}));
vi.mock("@/bot/features/member-log/handlers/accountAge", () => ({
  calcDuration: (ts: number) => calcDurationMock(ts),
}));
vi.mock("discord.js", async () => {
  const actual = await vi.importActual("discord.js");
  return {
    ...(actual as object),
    EmbedBuilder: EmbedBuilderMock,
  };
});

// ---- ヘルパー ----

/** 標準的なテキストチャンネルモックを生成する */
function makeTextChannel(overrides: Record<string, unknown> = {}) {
  return {
    type: ChannelType.GuildText,
    send: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/** 標準的なギルドメンバーモックを生成する */
function makeGuildMember(overrides: Record<string, unknown> = {}) {
  const defaultChannel = makeTextChannel();
  return {
    user: {
      id: "user-1",
      displayName: "TestUser",
      createdTimestamp: new Date("2020-01-01").getTime(),
      displayAvatarURL: vi.fn(() => "https://cdn.example.com/avatar.png"),
    },
    guild: {
      id: "guild-1",
      memberCount: 100,
      channels: {
        cache: new Map([["ch-1", defaultChannel]]),
      },
    },
    joinedTimestamp: new Date("2025-01-01").getTime(),
    _channel: defaultChannel,
    ...overrides,
  };
}

// guildMemberAddHandler の正常フロー・早期リターン・エラー委譲を検証
describe("bot/features/member-log/handlers/guildMemberAddHandler", () => {
  // 各ケースでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 設定取得系の早期リターン分岐を検証
  describe("early returns", () => {
    // config が null の場合は channel.send が呼ばれないことを確認
    it("returns early when config is null", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue(null);
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      expect(member._channel.send).not.toHaveBeenCalled();
    });

    // config.enabled が false の場合は channel.send が呼ばれないことを確認
    it("returns early when config.enabled is false", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: false,
        channelId: "ch-1",
      });
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      expect(member._channel.send).not.toHaveBeenCalled();
    });

    // channelId が未設定の場合は channel.send が呼ばれないことを確認
    it("returns early when channelId is not set", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: null,
      });
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      expect(member._channel.send).not.toHaveBeenCalled();
    });

    // チャンネルが cache に存在しない場合に logger.warn が呼ばれ channel.send は呼ばれないことを確認
    it("warns and returns early when channel is not in cache", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "unknown-ch",
      });
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      expect(loggerMock.warn).toHaveBeenCalledWith(
        "system:member-log.channel_not_found",
      );
      expect(member._channel.send).not.toHaveBeenCalled();
    });

    // チャンネルがテキストチャンネル以外の場合に logger.warn が呼ばれ channel.send は呼ばれないことを確認
    it("warns and returns early when channel is not a text channel", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-voice",
      });
      const voiceChannel = { type: ChannelType.GuildVoice, send: vi.fn() };
      const member = makeGuildMember();
      (member.guild.channels.cache as Map<string, unknown>).set(
        "ch-voice",
        voiceChannel,
      );

      await handleGuildMemberAdd(member as never);

      expect(loggerMock.warn).toHaveBeenCalled();
      expect(voiceChannel.send).not.toHaveBeenCalled();
    });
  });

  // 正常フロー（Embed 送信・フッター・フィールド構成）を検証
  describe("success flow", () => {
    // 設定が有効な場合に channel.send が embeds を含む引数で呼ばれることを確認
    it("sends embed to channel when config is valid", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        joinMessage: null,
      });
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      expect(member._channel.send).toHaveBeenCalledWith(
        expect.objectContaining({ embeds: expect.any(Array) }),
      );
    });

    // joinMessage が設定されている場合に content が渡されることを確認
    it("includes content when joinMessage is configured", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        joinMessage: "ようこそ {user}さん！",
      });
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      const callArgs = (member._channel.send as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(callArgs.content).toContain("<@user-1>");
    });

    // joinMessage が未設定の場合に content が undefined であることを確認
    it("sets content to undefined when joinMessage is not set", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        joinMessage: undefined,
      });
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      const callArgs = (member._channel.send as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(callArgs.content).toBeUndefined();
    });

    // joinedTimestamp が null の場合でも sendが呼ばれることを確認（serverJoined フィールドは省略）
    it("sends embed without serverJoined field when joinedTimestamp is null", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        joinMessage: null,
      });
      const member = makeGuildMember({ joinedTimestamp: null });

      await handleGuildMemberAdd(member as never);

      expect(member._channel.send).toHaveBeenCalled();
    });

    // calcDuration が years=0, months=0 の場合でも送信されることを確認（分岐カバレッジ）
    it("sends embed when calcDuration returns years=0 months=0", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      calcDurationMock.mockReturnValueOnce({ years: 0, months: 0, days: 5 });
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        joinMessage: null,
      });
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      expect(member._channel.send).toHaveBeenCalled();
    });

    // calcDuration が years>0, months=0, days=0 の場合でも送信されることを確認（days分岐カバレッジ）
    it("sends embed when calcDuration returns months=0 days=0", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      calcDurationMock.mockReturnValueOnce({ years: 1, months: 0, days: 0 });
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        joinMessage: null,
      });
      const member = makeGuildMember();

      await handleGuildMemberAdd(member as never);

      expect(member._channel.send).toHaveBeenCalled();
    });

    // 送信成功後に logger.debug が呼ばれることを確認
    it("logs debug after successful send", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        joinMessage: null,
      });

      await handleGuildMemberAdd(makeGuildMember() as never);

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:member-log.join_notification_sent",
      );
    });
  });

  // エラー発生時に Bot がクラッシュしないことを検証
  describe("error handling", () => {
    // channel.send が例外を投げた場合に logger.error が呼ばれることを確認
    it("logs error when channel.send throws", async () => {
      const { handleGuildMemberAdd } =
        await import("@/bot/features/member-log/handlers/guildMemberAddHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        joinMessage: null,
      });
      const member = makeGuildMember();
      (member._channel.send as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("send failed"),
      );

      await expect(
        handleGuildMemberAdd(member as never),
      ).resolves.toBeUndefined();
      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:member-log.notification_failed",
        expect.any(Object),
      );
    });
  });
});
