import { handleBumpReminderConfigEnable } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.enable";

const ensureManageGuildPermissionMock = jest.fn();
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

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.enable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
    setEnabledMock.mockResolvedValue(undefined);
  });

  it("enables bump reminder in current channel and replies success", async () => {
    const interaction = {
      channelId: "channel-1",
      reply: jest.fn().mockResolvedValue(undefined),
    };

    await handleBumpReminderConfigEnable(interaction as never, "guild-1");

    expect(setEnabledMock).toHaveBeenCalledWith("guild-1", true, "channel-1");
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated" }],
      flags: 64,
    });
  });
});
