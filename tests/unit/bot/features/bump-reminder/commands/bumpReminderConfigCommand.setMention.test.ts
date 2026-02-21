import { handleBumpReminderConfigSetMention } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.setMention";
import { ValidationError } from "@/shared/errors/customErrors";

const ensureManageGuildPermissionMock = vi.fn();
const getBumpReminderConfigMock = vi.fn();

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
    addBumpReminderMentionUser: vi.fn(),
    removeBumpReminderMentionUser: vi.fn(),
    setBumpReminderMentionRole: vi.fn(),
  }),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: vi.fn((description: string) => ({ description })),
}));

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.setMention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        getRole: vi.fn(() => null),
        getUser: vi.fn(() => null),
      },
      reply: vi.fn(),
    };

    await expect(
      handleBumpReminderConfigSetMention(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
