import { handleBumpReminderConfigDisable } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.disable";

const ensureManageGuildPermissionMock = jest.fn();
const cancelReminderMock = jest.fn();
const setEnabledMock = jest.fn();
const createSuccessEmbedMock = jest.fn((description: string) => ({
  description,
}));

jest.mock("@/shared/locale", () => ({
  tDefault: jest.fn((key: string) => `default:${key}`),
  tGuild: jest.fn(async () => "translated"),
}));

jest.mock("@/shared/utils", () => ({
  logger: { info: jest.fn() },
}));

jest.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderManager: () => ({
    cancelReminder: (...args: unknown[]) => cancelReminderMock(...args),
  }),
  getBotBumpReminderConfigService: () => ({
    setBumpReminderEnabled: (...args: unknown[]) => setEnabledMock(...args),
  }),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: (description: string) =>
    createSuccessEmbedMock(description),
}));

jest.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.disable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
    cancelReminderMock.mockResolvedValue(undefined);
    setEnabledMock.mockResolvedValue(undefined);
  });

  it("cancels pending reminder, disables config, and replies success", async () => {
    const interaction = {
      reply: jest.fn().mockResolvedValue(undefined),
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
