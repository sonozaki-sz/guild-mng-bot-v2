// tests/unit/bot/features/member-log/commands/memberLogConfigCommand.enable.test.ts
import { handleMemberLogConfigEnable } from "@/bot/features/member-log/commands/memberLogConfigCommand.enable";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----
const ensurePermissionMock = vi.fn();
const getMemberLogConfigMock = vi.fn();
const setEnabledMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);
const tDefaultMock = vi.fn((key: string) => key);
const loggerInfoMock = vi.fn();
const createSuccessEmbedMock = vi.fn(
  (desc: string, opts?: { title?: string }) => ({
    description: desc,
    title: opts?.title,
  }),
);
const createWarningEmbedMock = vi.fn((desc: string) => ({ description: desc }));

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.guard",
  () => ({
    ensureMemberLogManageGuildPermission: (...args: unknown[]) =>
      ensurePermissionMock(...args),
  }),
);

vi.mock("@/bot/services/botMemberLogDependencyResolver", () => ({
  getBotMemberLogConfigService: () => ({
    getMemberLogConfig: (...args: unknown[]) => getMemberLogConfigMock(...args),
    setEnabled: (...args: unknown[]) => setEnabledMock(...args),
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
  createWarningEmbed: (desc: string) => createWarningEmbedMock(desc),
}));

// ---- ヘルパー ----

/** テスト用 interaction モックを生成する */
function makeInteraction() {
  return { reply: vi.fn().mockResolvedValue(undefined) };
}

// handleMemberLogConfigEnable の権限・前提条件チェック・成功フローを検証
describe("bot/features/member-log/commands/memberLogConfigCommand.enable", () => {
  // 各テストでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
    setEnabledMock.mockResolvedValue(undefined);
  });

  // ガードが ValidationError を投げた場合にそれが伝播することを確認
  it("propagates error when guard throws", async () => {
    ensurePermissionMock.mockRejectedValue(new ValidationError("no-perm"));

    await expect(
      handleMemberLogConfigEnable(makeInteraction() as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // channelId が未設定の場合に warning embed が返され setEnabled が呼ばれないことを確認
  it("replies with warning and does not enable when channelId is missing", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: false,
      channelId: null,
    });
    const interaction = makeInteraction();

    await handleMemberLogConfigEnable(interaction as never, "guild-1");

    expect(setEnabledMock).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: [expect.objectContaining({ description: expect.any(String) })],
      }),
    );
    expect(createWarningEmbedMock).toHaveBeenCalled();
  });

  // config が null の場合も warning embed が返されることを確認
  it("replies with warning when config is null", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue(null);
    const interaction = makeInteraction();

    await handleMemberLogConfigEnable(interaction as never, "guild-1");

    expect(setEnabledMock).not.toHaveBeenCalled();
    expect(createWarningEmbedMock).toHaveBeenCalled();
  });

  // channelId が設定済みの場合に setEnabled(true) が呼ばれることを確認
  it("calls service.setEnabled(true) when channelId is set", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: false,
      channelId: "ch-1",
    });
    const interaction = makeInteraction();

    await handleMemberLogConfigEnable(interaction as never, "guild-1");

    expect(setEnabledMock).toHaveBeenCalledWith("guild-1", true);
  });

  // 成功時に success embed で reply が呼ばれることを確認
  it("replies with success embed when enabled successfully", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: false,
      channelId: "ch-1",
    });
    const interaction = makeInteraction();

    await handleMemberLogConfigEnable(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
    expect(createSuccessEmbedMock).toHaveBeenCalled();
  });

  // 成功時に logger.info が呼ばれることを確認
  it("logs info on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: false,
      channelId: "ch-1",
    });

    await handleMemberLogConfigEnable(makeInteraction() as never, "guild-1");

    expect(loggerInfoMock).toHaveBeenCalledWith(
      "system:member-log.config_enabled",
    );
  });
});
