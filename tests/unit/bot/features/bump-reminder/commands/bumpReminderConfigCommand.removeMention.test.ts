import { handleBumpReminderConfigRemoveMention } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.removeMention";
import { ValidationError } from "@/shared/errors";
import { BUMP_REMINDER_MENTION_ROLE_RESULT } from "@/shared/features/bump-reminder";

const ensureManageGuildPermissionMock = jest.fn();
const getBumpReminderConfigMock = jest.fn();
const setMentionRoleMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tDefault: jest.fn((key: string) => `default:${key}`),
  tGuild: jest.fn(async () => "translated"),
}));

jest.mock("@/shared/utils", () => ({
  logger: { info: jest.fn() },
}));

jest.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderConfigService: () => ({
    getBumpReminderConfig: (...args: unknown[]) =>
      getBumpReminderConfigMock(...args),
    setBumpReminderMentionRole: (...args: unknown[]) =>
      setMentionRoleMock(...args),
    clearBumpReminderMentionUsers: jest.fn(),
    clearBumpReminderMentions: jest.fn(),
    removeBumpReminderMentionUser: jest.fn(),
  }),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: jest.fn((description: string) => ({ description })),
  createSuccessEmbed: jest.fn((description: string) => ({ description })),
}));

jest.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.removeMention", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
    getBumpReminderConfigMock.mockResolvedValue({
      enabled: true,
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1"],
    });
  });

  it("throws ValidationError when role target is not configured", async () => {
    setMentionRoleMock.mockResolvedValue(
      BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED,
    );

    const interaction = {
      options: {
        getString: jest.fn(() => "role"),
      },
      reply: jest.fn(),
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
        getString: jest.fn(() => "role"),
      },
      reply: jest.fn().mockResolvedValue(undefined),
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
