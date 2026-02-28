// tests/unit/bot/features/member-log/handlers/guildMemberRemoveHandler.test.ts
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
const getGuildTranslatorMock = vi.fn(async (_guildId: string) => tGuildMock);

const loggerMock = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const calcDurationMock = vi.fn((_ts: number) => ({
  years: 2,
  months: 1,
  days: 5,
}));

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

/** 標準的な退出メンバーモックを生成する */
function makeGuildMember(
  overrides: Partial<{
    user: object | null;
    joinedTimestamp: number | null;
    channelId: string;
    memberCount: number;
  }> = {},
) {
  const channel = makeTextChannel();
  const channelId = overrides.channelId ?? "ch-1";
  return {
    user:
      overrides.user !== undefined
        ? overrides.user
        : {
            id: "user-1",
            displayName: "TestUser",
            createdTimestamp: new Date("2021-06-15").getTime(),
            displayAvatarURL: vi.fn(() => "https://cdn.example.com/avatar.png"),
          },
    guild: {
      id: "guild-1",
      memberCount: overrides.memberCount ?? 99,
      channels: {
        cache: new Map([[channelId, channel]]),
      },
    },
    joinedTimestamp:
      overrides.joinedTimestamp !== undefined
        ? overrides.joinedTimestamp
        : new Date("2025-01-01").getTime(),
    _channel: channel,
  };
}

// handleGuildMemberRemove の早期リターン・正常フロー・エラー処理を検証
describe("bot/features/member-log/handlers/guildMemberRemoveHandler", () => {
  // 各テストでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 設定取得・チャンネル解決の早期リターン分岐を検証
  describe("early returns", () => {
    // config が null の場合は channel.send が呼ばれないことを確認
    it("returns early when config is null", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue(null);
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      expect(member._channel.send).not.toHaveBeenCalled();
    });

    // config.enabled が false の場合は channel.send が呼ばれないことを確認
    it("returns early when config.enabled is false", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: false,
        channelId: "ch-1",
      });
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      expect(member._channel.send).not.toHaveBeenCalled();
    });

    // channelId が未設定の場合は channel.send が呼ばれないことを確認
    it("returns early when channelId is not set", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: null,
      });
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      expect(member._channel.send).not.toHaveBeenCalled();
    });

    // チャンネルが cache に存在しない場合に logger.warn が呼ばれることを確認
    it("warns and returns early when channel is not in cache", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "unknown-ch",
      });
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      expect(loggerMock.warn).toHaveBeenCalledWith(
        "system:member-log.channel_not_found",
      );
      expect(member._channel.send).not.toHaveBeenCalled();
    });

    // テキストチャンネル以外の場合に logger.warn が呼ばれることを確認
    it("warns and returns early when channel is not a text channel", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-voice",
      });
      const member = makeGuildMember();
      const voiceChannel = { type: ChannelType.GuildVoice, send: vi.fn() };
      (member.guild.channels.cache as Map<string, unknown>).set(
        "ch-voice",
        voiceChannel,
      );

      await handleGuildMemberRemove(member as never);

      expect(loggerMock.warn).toHaveBeenCalled();
      expect(voiceChannel.send).not.toHaveBeenCalled();
    });
  });

  // 正常フロー（Embed 送信・サムネイル・カスタムメッセージ）を検証
  describe("success flow", () => {
    // 有効な設定で channel.send が embeds を含む引数で呼ばれることを確認
    it("sends embed to channel when config is valid", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      expect(member._channel.send).toHaveBeenCalledWith(
        expect.objectContaining({ embeds: expect.any(Array) }),
      );
    });

    // アバター URL が存在する場合に setThumbnail が呼ばれることを確認
    it("sets thumbnail when avatarUrl is present", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });

      await handleGuildMemberRemove(makeGuildMember() as never);

      expect(embedInstance.setThumbnail).toHaveBeenCalledWith(
        "https://cdn.example.com/avatar.png",
      );
    });

    // member.user が null の場合でも channel.send が呼ばれ setThumbnail は呼ばれないことを確認
    it("sends embed without thumbnail when member.user is null (partial member)", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });
      const member = makeGuildMember({ user: null });

      await handleGuildMemberRemove(member as never);

      expect(member._channel.send).toHaveBeenCalled();
      expect(embedInstance.setThumbnail).not.toHaveBeenCalled();
    });

    // joinedTimestamp が null の場合でも channel.send が呼ばれることを確認
    it("sends embed when joinedTimestamp is null", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });

      await handleGuildMemberRemove(
        makeGuildMember({ joinedTimestamp: null }) as never,
      );

      expect(embedInstance.addFields).toHaveBeenCalled();
    });

    // leaveMessage が設定されている場合に content が渡されることを確認
    it("includes content when leaveMessage is configured", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: "さようなら {user}！",
      });
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      const callArgs = (member._channel.send as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(callArgs.content).toContain("<@user-1>");
    });

    // leaveMessage が未設定の場合に content が undefined であることを確認
    it("sets content to undefined when leaveMessage is not set", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: undefined,
      });
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      const callArgs = (member._channel.send as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(callArgs.content).toBeUndefined();
    });

    // calcDuration が years=0, months=0 の場合でも送信されることを確認（分岐カバレッジ）
    it("sends embed when calcDuration returns years=0 months=0", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      calcDurationMock.mockReturnValueOnce({ years: 0, months: 0, days: 5 });
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      expect(member._channel.send).toHaveBeenCalled();
    });

    // calcDuration が years>0, months=0, days=0 の場合でも送信されることを確認（days分岐カバレッジ）
    it("sends embed when calcDuration returns months=0 days=0", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      calcDurationMock.mockReturnValueOnce({ years: 1, months: 0, days: 0 });
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });
      const member = makeGuildMember();

      await handleGuildMemberRemove(member as never);

      expect(member._channel.send).toHaveBeenCalled();
    });

    // joinedTimestamp が undefined の場合に stayDays の ?? 0 分岐を通ることを確認
    it("sends embed when joinedTimestamp is undefined (covers ?? 0 branch)", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });
      const member = makeGuildMember({ joinedTimestamp: undefined as never });

      await handleGuildMemberRemove(member as never);

      expect(member._channel.send).toHaveBeenCalled();
    });

    // 送信成功後に logger.debug が呼ばれることを確認
    it("logs debug after successful send", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });

      await handleGuildMemberRemove(makeGuildMember() as never);

      expect(loggerMock.debug).toHaveBeenCalledWith(
        "system:member-log.leave_notification_sent",
      );
    });
  });

  // エラー発生時に Bot がクラッシュしないことを検証
  describe("error handling", () => {
    // channel.send が例外を投げた場合に logger.error が呼ばれることを確認
    it("logs error when channel.send throws", async () => {
      const { handleGuildMemberRemove } =
        await import("@/bot/features/member-log/handlers/guildMemberRemoveHandler");
      getMemberLogConfigMock.mockResolvedValue({
        enabled: true,
        channelId: "ch-1",
        leaveMessage: null,
      });
      const member = makeGuildMember();
      (member._channel.send as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("send failed"),
      );

      await expect(
        handleGuildMemberRemove(member as never),
      ).resolves.toBeUndefined();
      expect(loggerMock.error).toHaveBeenCalledWith(
        "system:member-log.notification_failed",
        expect.any(Object),
      );
    });
  });
});
