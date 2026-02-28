// tests/unit/bot/features/member-log/commands/memberLogConfigCommand.disable.test.ts
import { handleMemberLogConfigDisable } from "@/bot/features/member-log/commands/memberLogConfigCommand.disable";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----
const ensurePermissionMock = vi.fn();
const setEnabledMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);
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
}));

// ---- ヘルパー ----

/** テスト用 interaction モックを生成する */
function makeInteraction() {
  return { reply: vi.fn().mockResolvedValue(undefined) };
}

// handleMemberLogConfigDisable の権限チェック・無効化フローを検証
describe("bot/features/member-log/commands/memberLogConfigCommand.disable", () => {
  // 各テストでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
    setEnabledMock.mockResolvedValue(undefined);
  });

  // ガードが ValidationError を投げた場合にそれが伝播することを確認
  it("propagates error when guard throws", async () => {
    ensurePermissionMock.mockRejectedValue(new ValidationError("no-perm"));

    await expect(
      handleMemberLogConfigDisable(makeInteraction() as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // setEnabled(false) が正しい引数で呼ばれることを確認
  it("calls service.setEnabled(false) with correct guildId", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigDisable(interaction as never, "guild-1");

    expect(setEnabledMock).toHaveBeenCalledWith("guild-1", false);
  });

  // 成功時に success embed で reply が呼ばれることを確認
  it("replies with success embed on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    const interaction = makeInteraction();

    await handleMemberLogConfigDisable(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
    expect(createSuccessEmbedMock).toHaveBeenCalled();
  });

  // 成功時に logger.info が呼ばれることを確認
  it("logs info on success", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);

    await handleMemberLogConfigDisable(makeInteraction() as never, "guild-1");

    expect(loggerInfoMock).toHaveBeenCalledWith(
      "system:member-log.config_disabled",
    );
  });
});
