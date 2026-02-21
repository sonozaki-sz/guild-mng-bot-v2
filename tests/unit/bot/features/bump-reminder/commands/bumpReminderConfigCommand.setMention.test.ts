import { handleBumpReminderConfigSetMention } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.setMention";
import { ValidationError } from "@/shared/errors";

const ensureManageGuildPermissionMock = jest.fn();
const getBumpReminderConfigMock = jest.fn();

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
    addBumpReminderMentionUser: jest.fn(),
    removeBumpReminderMentionUser: jest.fn(),
    setBumpReminderMentionRole: jest.fn(),
  }),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: jest.fn((description: string) => ({ description })),
}));

jest.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.setMention", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
    getBumpReminderConfigMock.mockResolvedValue({
      enabled: true,
      mentionRoleId: undefined,
      mentionUserIds: [],
    });
  });

  it("throws ValidationError when both role and user are missing", async () => {
    const interaction = {
      options: {
        getRole: jest.fn(() => null),
        getUser: jest.fn(() => null),
      },
      reply: jest.fn(),
    };

    await expect(
      handleBumpReminderConfigSetMention(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
