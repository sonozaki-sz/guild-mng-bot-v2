// tests/unit/bot/features/member-log/commands/memberLogConfigCommand.setChannel.test.ts
import { MEMBER_LOG_CONFIG_COMMAND } from "@/bot/features/member-log/commands/memberLogConfigCommand.constants";
import { handleMemberLogConfigSetChannel } from "@/bot/features/member-log/commands/memberLogConfigCommand.setChannel";
import { ValidationError } from "@/shared/errors/customErrors";
import { ChannelType } from "discord.js";

// ---- モック定義 ----
const ensurePermissionMock = vi.fn();
const setChannelIdMock = vi.fn();
const tGuildMock = vi.fn(
  async (_guildId: string, key: string, _opts?: Record<string, unknown>) => key,
);
const tDefaultMock = vi.fn(
  (key: string, _opts?: Record<string, unknown>) => key,
);
const loggerInfoMock = vi.fn();
const createSuccessEmbedMock = vi.fn(
  (desc: string, opts?: { title?: string }) => ({
    description: desc,
    title: opts?.title,
  }),
);

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.guard",
  () => ({
    ensureMemberLogManageGuildPermission: (...args: unknown[]) =>
      ensurePermissionMock(...args),
  }),
);

vi.mock("@/bot/services/botMemberLogDependencyResolver", () => ({
  getBotMemberLogConfigService: () => ({
    setChannelId: (...args: unknown[]) => setChannelIdMock(...args),
  }),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (guildId: string, key: string, opts?: Record<string, unknown>) =>
    tGuildMock(guildId, key, opts),
  tDefault: (key: string, opts?: Record<string, unknown>) =>
    tDefaultMock(key, opts),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: (...args: unknown[]) => loggerInfoMock(...args) },
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (desc: string, opts?: { title?: string }) =>
    createSuccessEmbedMock(desc, opts),
}));

// ---- ヘルパー ----

/** テスト用 interaction モックを生成する */
function makeInteraction(channelType: ChannelType = ChannelType.GuildText) {
  return {
    options: {
      getChannel: vi.fn(() => ({
        id: "ch-123",
        type: channelType,
      })),
    },
    reply: vi.fn().mockResolvedValue(undefined),
  };
}

// handleMemberLogConfigSetChannel の権限チェック・チャンネル検証・保存フローを検証
describe("bot/features/member-log/commands/memberLogConfigCommand.setChannel", () => {
  // 各テストでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
    setChannelIdMock.mockResolvedValue(undefined);
  });

  // ガードが ValidationError を投げた場合にそれが伝播することを確認
  it("propagates error when guard throws", async () => {
    ensurePermissionMock.mockRejectedValue(new ValidationError("no-perm"));
    const interaction = makeInteraction();

    await expect(
      handleMemberLogConfigSetChannel(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // テキストチャンネル以外を選択した場合に ValidationError を投げることを確認
  it("throws ValidationError when selected channel is not a text channel", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction(ChannelType.GuildVoice);

    await expect(
      handleMemberLogConfigSetChannel(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // テキストチャンネルが選択された場合に setChannelId が呼ばれることを確認
  it("calls service.setChannelId with correct arguments on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigSetChannel(interaction as never, "guild-1");

    expect(setChannelIdMock).toHaveBeenCalledWith("guild-1", "ch-123");
  });

  // 成功時に interaction.reply が呼ばれることを確認
  it("replies with success embed on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigSetChannel(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });

  // 成功時に logger.info が呼ばれることを確認
  it("logs info on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigSetChannel(interaction as never, "guild-1");

    expect(loggerInfoMock).toHaveBeenCalledWith(
      "system:member-log.config_set_channel",
    );
  });

  // getChannel が MEMBER_LOG_CONFIG_COMMAND.OPTION.CHANNEL を引数に呼ばれることを確認
  it("requests channel option with correct option name", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigSetChannel(interaction as never, "guild-1");

    expect(interaction.options.getChannel).toHaveBeenCalledWith(
      MEMBER_LOG_CONFIG_COMMAND.OPTION.CHANNEL,
      true,
    );
  });
});
