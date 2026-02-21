import { handleBumpReminderConfigShow } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.show";

const ensureManageGuildPermissionMock = jest.fn();
const getBumpReminderConfigMock = jest.fn();
const createInfoEmbedMock = jest.fn((description: string) => ({
  description,
  kind: "info",
}));

jest.mock("@/shared/locale", () => ({
  tGuild: jest.fn(async () => "translated"),
}));

jest.mock("@/bot/services/botBumpReminderDependencyResolver", () => ({
  getBotBumpReminderConfigService: () => ({
    getBumpReminderConfig: (...args: unknown[]) =>
      getBumpReminderConfigMock(...args),
  }),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: (description: string) => createInfoEmbedMock(description),
}));

jest.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.show", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
  });

  it("replies not-configured embed when config is null", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce(null);
    const interaction = { reply: jest.fn().mockResolvedValue(undefined) };

    await handleBumpReminderConfigShow(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "translated", kind: "info" }],
      flags: 64,
    });
  });

  it("replies configured embed when config exists", async () => {
    getBumpReminderConfigMock.mockResolvedValueOnce({
      enabled: true,
      mentionRoleId: "role-1",
      mentionUserIds: ["user-1"],
    });
    const interaction = { reply: jest.fn().mockResolvedValue(undefined) };

    await handleBumpReminderConfigShow(interaction as never, "guild-1");

    expect(createInfoEmbedMock).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [{ description: "", kind: "info" }],
      flags: 64,
    });
  });
});
