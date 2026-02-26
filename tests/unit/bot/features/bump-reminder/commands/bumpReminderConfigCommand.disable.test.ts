// tests/unit/bot/features/bump-reminder/commands/bumpReminderConfigCommand.disable.test.ts
import { handleBumpReminderConfigDisable } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.disable";

const ensureManageGuildPermissionMock = vi.fn();
const cancelReminderMock = vi.fn();
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
  getBotBumpReminderManager: () => ({
    cancelReminder: (...args: unknown[]) => cancelReminderMock(...args),
  }),
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

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.disable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
    cancelReminderMock.mockResolvedValue(undefined);
    setEnabledMock.mockResolvedValue(undefined);
  });

  it("cancels pending reminder, disables config, and replies success", async () => {
    const interaction = {
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await handleBumpReminderConfigDisable(interaction as never, "guild-1");

    expect(cancelReminderMock).toHaveBeenCalledWith("guild-1");
    expect(setEnabledMock).toHaveBeenCalledWith("guild-1", false);
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: 64,
    });
  });
});
