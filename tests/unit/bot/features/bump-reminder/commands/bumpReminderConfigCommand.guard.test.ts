import { ensureManageGuildPermission } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard";
import { ValidationError } from "@/shared/errors";
import { PermissionFlagsBits } from "discord.js";

const tGuildMock: jest.Mock = jest.fn(async () => "permission required");

jest.mock("@/shared/locale", () => ({
  tGuild: (guildId: string, key: string) => tGuildMock(guildId, key),
}));

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes when interaction has manage-guild permission", async () => {
    const interaction = {
      memberPermissions: {
        has: jest.fn(() => true),
      },
    };

    await expect(
      ensureManageGuildPermission(interaction as never, "guild-1"),
    ).resolves.toBeUndefined();
    expect(interaction.memberPermissions.has).toHaveBeenCalledWith(
      PermissionFlagsBits.ManageGuild,
    );
  });

  it("throws ValidationError when permission is missing", async () => {
    const interaction = {
      memberPermissions: {
        has: jest.fn(() => false),
      },
    };

    await expect(
      ensureManageGuildPermission(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
