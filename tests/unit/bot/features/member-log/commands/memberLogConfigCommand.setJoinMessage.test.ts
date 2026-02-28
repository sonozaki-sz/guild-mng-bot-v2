// tests/unit/bot/features/member-log/commands/memberLogConfigCommand.setJoinMessage.test.ts
import { MEMBER_LOG_CONFIG_COMMAND } from "@/bot/features/member-log/commands/memberLogConfigCommand.constants";
import { handleMemberLogConfigSetJoinMessage } from "@/bot/features/member-log/commands/memberLogConfigCommand.setJoinMessage";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----
const ensurePermissionMock = vi.fn();
const setJoinMessageMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);
const tDefaultMock = vi.fn((key: string) => key);
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
    setJoinMessage: (...args: unknown[]) => setJoinMessageMock(...args),
  }),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (guildId: string, key: string) => tGuildMock(guildId, key),
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
function makeInteraction(message = "ようこそ {user}！") {
  return {
    options: {
      getString: vi.fn(() => message),
    },
    reply: vi.fn().mockResolvedValue(undefined),
  };
}

// handleMemberLogConfigSetJoinMessage の権限チェック・保存・応答フローを検証
describe("bot/features/member-log/commands/memberLogConfigCommand.setJoinMessage", () => {
  // 各テストでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
    setJoinMessageMock.mockResolvedValue(undefined);
  });

  // ガードが ValidationError を投げた場合にそれが伝播することを確認
  it("propagates error when guard throws", async () => {
    ensurePermissionMock.mockRejectedValue(new ValidationError("no-perm"));

    await expect(
      handleMemberLogConfigSetJoinMessage(
        makeInteraction() as never,
        "guild-1",
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // service.setJoinMessage が正しい引数で呼ばれることを確認
  it("calls service.setJoinMessage with correct arguments", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction("こんにちは {user}");

    await handleMemberLogConfigSetJoinMessage(interaction as never, "guild-1");

    expect(setJoinMessageMock).toHaveBeenCalledWith(
      "guild-1",
      "こんにちは {user}",
    );
  });

  // getString が MEMBER_LOG_CONFIG_COMMAND.OPTION.MESSAGE を引数に呼ばれることを確認
  it("requests message option with correct option name", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigSetJoinMessage(interaction as never, "guild-1");

    expect(interaction.options.getString).toHaveBeenCalledWith(
      MEMBER_LOG_CONFIG_COMMAND.OPTION.MESSAGE,
      true,
    );
  });

  // 成功時に success embed で reply が呼ばれることを確認
  it("replies with success embed on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigSetJoinMessage(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
    expect(createSuccessEmbedMock).toHaveBeenCalled();
  });

  // 成功時に logger.info が呼ばれることを確認
  it("logs info on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);

    await handleMemberLogConfigSetJoinMessage(
      makeInteraction() as never,
      "guild-1",
    );

    expect(loggerInfoMock).toHaveBeenCalledWith(
      "system:member-log.config_join_message_set",
    );
  });
});
