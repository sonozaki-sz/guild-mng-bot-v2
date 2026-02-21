import { BUMP_REMINDER_CONFIG_COMMAND } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.constants";

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.constants", () => {
  it("defines expected command and subcommand names", () => {
    expect(BUMP_REMINDER_CONFIG_COMMAND.NAME).toBe("bump-reminder-config");
    expect(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.ENABLE).toBe("enable");
    expect(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.DISABLE).toBe("disable");
    expect(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SHOW).toBe("show");
  });
});
