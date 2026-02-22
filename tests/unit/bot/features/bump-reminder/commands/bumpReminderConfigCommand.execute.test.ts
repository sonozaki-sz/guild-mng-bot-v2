import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import { BUMP_REMINDER_CONFIG_COMMAND } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.constants";
import { executeBumpReminderConfigCommand } from "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.execute";

const ensureManageGuildPermissionMock = vi.fn();
const enableMock = vi.fn();
const disableMock = vi.fn();
const setMentionMock = vi.fn();
const removeMentionMock = vi.fn();
const showMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.guard",
  () => ({
    ensureManageGuildPermission: (...args: unknown[]) =>
      ensureManageGuildPermissionMock(...args),
  }),
);

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.enable",
  () => ({
    handleBumpReminderConfigEnable: (...args: unknown[]) => enableMock(...args),
  }),
);

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.disable",
  () => ({
    handleBumpReminderConfigDisable: (...args: unknown[]) =>
      disableMock(...args),
  }),
);

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.setMention",
  () => ({
    handleBumpReminderConfigSetMention: (...args: unknown[]) =>
      setMentionMock(...args),
  }),
);

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.removeMention",
  () => ({
    handleBumpReminderConfigRemoveMention: (...args: unknown[]) =>
      removeMentionMock(...args),
  }),
);

vi.mock(
  "@/bot/features/bump-reminder/commands/bumpReminderConfigCommand.show",
  () => ({
    handleBumpReminderConfigShow: (...args: unknown[]) => showMock(...args),
  }),
);

function createInteraction(subcommand: string) {
  return {
    guildId: "guild-1",
    options: {
      getSubcommand: vi.fn(() => subcommand),
    },
  };
}

describe("bot/features/bump-reminder/commands/bumpReminderConfigCommand.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureManageGuildPermissionMock.mockResolvedValue(undefined);
  });

  it("routes enable subcommand", async () => {
    const interaction = createInteraction(
      BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.ENABLE,
    );

    await executeBumpReminderConfigCommand(interaction as never);

    expect(enableMock).toHaveBeenCalledWith(interaction, "guild-1");
  });

  it("routes show subcommand", async () => {
    const interaction = createInteraction(
      BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SHOW,
    );

    await executeBumpReminderConfigCommand(interaction as never);

    expect(showMock).toHaveBeenCalledWith(interaction, "guild-1");
  });

  it("delegates invalid subcommand error to command error handler", async () => {
    const interaction = createInteraction("unknown");

    await executeBumpReminderConfigCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });
});
