// tests/unit/bot/features/bump-reminder/commands/bumpReminderConfigCommand.removeMention.test.ts
import { handleBumpReminderConfigRemoveMention } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.removeMention";
import { ValidationError } from "@/shared/errors/customErrors";
import { BUMP_REMINDER_MENTION_ROLE_RESULT } from "@/shared/features/bump-reminder/bumpReminderConfigService";

const ensureManageGuildPermissionMock = vi.fn();
const getBumpReminderConfigMock = vi.fn();
const setMentionRoleMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
  tGuild: vi.fn(async () => "translated"),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn() },
}));

vi.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderConfigService: () => ({
    getBumpReminderConfig: (...args: unknown[]) =>
      getBumpReminderConfigMock(...args),
    setBumpReminderMentionRole: (...args: unknown[]) =>
      setMentionRoleMock(...args),
    clearBumpReminderMentionUsers: vi.fn(),
    clearBumpReminderMentions: vi.fn(),
    removeBumpReminderMentionUser: vi.fn(),
  }),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: vi.fn((description: string) => ({ description })),
  createSuccessEmbed: vi.fn((description: string) => ({ description })),
}));

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

// remove-mention サブコマンドが
// ロール未設定時の ValidationError 送出と設定済みロール削除時の成功応答を
// サービス層の結果コードに応じて正しく分岐するかを検証する
describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.removeMention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
    getBumpReminderConfigMock.mockResolvedValue({
      enabled: true,
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1"],
    });
  });

  // サービスが NOT_CONFIGURED を返した場合（削除対象のロールが存在しない）は ValidationError を投げることを確認
  it("throws ValidationError when role target is not configured", async () => {
    setMentionRoleMock.mockResolvedValue(
      BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED,
    );

    const interaction = {
      options: {
        getString: vi.fn(() => "role"),
      },
      reply: vi.fn(),
    };

    await expect(
      handleBumpReminderConfigRemoveMention(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("replies success when role target is removed", async () => {
    setMentionRoleMock.mockResolvedValue(
      BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED,
    );

    const interaction = {
      options: {
        getString: vi.fn(() => "role"),
      },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await handleBumpReminderConfigRemoveMention(
      interaction as never,
      "guild-1",
    );

    expect(setMentionRoleMock).toHaveBeenCalledWith("guild-1", undefined);
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: 64,
    });
  });
});
