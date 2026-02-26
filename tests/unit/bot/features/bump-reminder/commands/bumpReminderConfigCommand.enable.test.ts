// tests/unit/bot/features/bump-reminder/commands/bumpReminderConfigCommand.enable.test.ts
import { handleBumpReminderConfigEnable } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.enable";

const ensureManageGuildPermissionMock = vi.fn();
const setEnabledMock = vi.fn();
const createSuccessEmbedMock = vi.fn((description: string) => ({
  description,
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
  tGuild: vi.fn(async () => "translated"),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { info: vi.fn() },
}));

vi.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderConfigService: () => ({
    setBumpReminderEnabled: (...args: unknown[]) => setEnabledMock(...args),
  }),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.enable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
    setEnabledMock.mockResolvedValue(undefined);
  });

  it("enables bump reminder in current channel and replies success", async () => {
    const interaction = {
      channelId: "channel-1",
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await handleBumpReminderConfigEnable(interaction as never, "guild-1");

    expect(setEnabledMock).toHaveBeenCalledWith("guild-1", true, "channel-1");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: 64,
    });
  });
});
