import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import { handleVacConfigCreateTrigger } from "@/bot/features/vac/commands/usecases/vacConfigCreateTrigger";
import { handleVacConfigRemoveTrigger } from "@/bot/features/vac/commands/usecases/vacConfigRemoveTrigger";
import { handleVacConfigShow } from "@/bot/features/vac/commands/usecases/vacConfigShow";
import { VAC_CONFIG_COMMAND } from "@/bot/features/vac/commands/vacConfigCommand.constants";
import { executeVacConfigCommand } from "@/bot/features/vac/commands/vacConfigCommand.execute";

vi.mock(
  "@/bot/features/vac/commands/usecases/vacConfigCreateTrigger",
  () => ({
    handleVacConfigCreateTrigger: vi.fn(),
  }),
);

vi.mock(
  "@/bot/features/vac/commands/usecases/vacConfigRemoveTrigger",
  () => ({
    handleVacConfigRemoveTrigger: vi.fn(),
  }),
);

vi.mock("@/bot/features/vac/commands/usecases/vacConfigShow", () => ({
  handleVacConfigShow: vi.fn(),
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
}));

function createInteraction(overrides?: {
  guildId?: string | null;
  hasManageGuild?: boolean;
  subcommand?: string;
}) {
  return {
    guildId:
      overrides && "guildId" in overrides ? overrides.guildId : "guild-1",
    memberPermissions: {
      has: vi.fn(() =>
        overrides && "hasManageGuild" in overrides
          ? overrides.hasManageGuild
          : true,
      ),
    },
    options: {
      getSubcommand: vi.fn(
        () => overrides?.subcommand ?? VAC_CONFIG_COMMAND.SUBCOMMAND.SHOW,
      ),
    },
  };
}

describe("bot/features/vac/commands/vacConfigCommand.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates guild-only validation error to handleCommandError", async () => {
    const interaction = createInteraction({ guildId: null });

    await executeVacConfigCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(handleVacConfigShow).not.toHaveBeenCalled();
  });

  it("delegates permission validation error to handleCommandError", async () => {
    const interaction = createInteraction({ hasManageGuild: false });

    await executeVacConfigCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(handleVacConfigCreateTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigRemoveTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigShow).not.toHaveBeenCalled();
  });

  it("delegates create-trigger-vc subcommand to usecase", async () => {
    const interaction = createInteraction({
      subcommand: VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER,
    });

    await executeVacConfigCommand(interaction as never);

    expect(handleVacConfigCreateTrigger).toHaveBeenCalledWith(
      interaction,
      "guild-1",
    );
    expect(handleVacConfigRemoveTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigShow).not.toHaveBeenCalled();
  });

  it("delegates remove-trigger-vc subcommand to usecase", async () => {
    const interaction = createInteraction({
      subcommand: VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER,
    });

    await executeVacConfigCommand(interaction as never);

    expect(handleVacConfigRemoveTrigger).toHaveBeenCalledWith(
      interaction,
      "guild-1",
    );
    expect(handleVacConfigCreateTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigShow).not.toHaveBeenCalled();
  });

  it("delegates show subcommand to usecase", async () => {
    const interaction = createInteraction({
      subcommand: VAC_CONFIG_COMMAND.SUBCOMMAND.SHOW,
    });

    await executeVacConfigCommand(interaction as never);

    expect(handleVacConfigShow).toHaveBeenCalledWith(interaction, "guild-1");
    expect(handleVacConfigCreateTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigRemoveTrigger).not.toHaveBeenCalled();
  });

  it("delegates invalid subcommand error to handleCommandError", async () => {
    const interaction = createInteraction({ subcommand: "invalid-subcommand" });

    await executeVacConfigCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(handleVacConfigCreateTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigRemoveTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigShow).not.toHaveBeenCalled();
  });
});
