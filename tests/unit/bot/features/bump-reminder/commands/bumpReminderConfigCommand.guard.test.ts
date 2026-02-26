// tests/unit/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard.test.ts
import type { Mock } from "vitest";
import { ensureManageGuildPermission } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard";
import { ValidationError } from "@/shared/errors/customErrors";
import { PermissionFlagsBits } from "discord.js";

const tGuildMock: Mock = vi.fn(async () => "permission required");

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (guildId: string, key: string) => tGuildMock(guildId, key),
}));

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes when interaction has manage-guild permission", async () => {
    const interaction = {
      memberPermissions: {
        has: vi.fn(() => true),
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
        has: vi.fn(() => false),
      },
    };

    await expect(
      ensureManageGuildPermission(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
