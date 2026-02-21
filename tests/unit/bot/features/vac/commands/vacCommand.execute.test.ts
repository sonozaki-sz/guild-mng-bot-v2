import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import { executeVacLimit } from "@/bot/features/vac/commands/usecases/vacLimit";
import { executeVacRename } from "@/bot/features/vac/commands/usecases/vacRename";
import { getManagedVacVoiceChannel } from "@/bot/features/vac/commands/usecases/vacVoiceChannelGuard";
import { VAC_COMMAND } from "@/bot/features/vac/commands/vacCommand.constants";
import { executeVacCommand } from "@/bot/features/vac/commands/vacCommand.execute";

jest.mock("@/bot/features/vac/commands/usecases/vacLimit", () => ({
  executeVacLimit: jest.fn(),
}));

jest.mock("@/bot/features/vac/commands/usecases/vacRename", () => ({
  executeVacRename: jest.fn(),
}));

jest.mock("@/bot/features/vac/commands/usecases/vacVoiceChannelGuard", () => ({
  getManagedVacVoiceChannel: jest.fn(),
}));

jest.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: jest.fn(),
}));

jest.mock("@/shared/locale", () => ({
  tDefault: jest.fn((key: string) => `default:${key}`),
}));

function createInteraction(overrides?: {
  guildId?: string | null;
  subcommand?: string;
}) {
  return {
    guildId:
      overrides && "guildId" in overrides ? overrides.guildId : "guild-1",
    options: {
      getSubcommand: jest.fn(
        () => overrides?.subcommand ?? VAC_COMMAND.SUBCOMMAND.VC_RENAME,
      ),
    },
  };
}

describe("bot/features/vac/commands/vacCommand.execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getManagedVacVoiceChannel as jest.Mock).mockResolvedValue({
      id: "voice-1",
    });
  });

  it("delegates guild-only validation error to handleCommandError", async () => {
    const interaction = createInteraction({ guildId: null });

    await executeVacCommand(interaction as never);

    expect(getManagedVacVoiceChannel).not.toHaveBeenCalled();
    expect(handleCommandError).toHaveBeenCalledTimes(1);
  });

  it("delegates vc-rename subcommand to executeVacRename", async () => {
    const interaction = createInteraction({
      subcommand: VAC_COMMAND.SUBCOMMAND.VC_RENAME,
    });

    await executeVacCommand(interaction as never);

    expect(getManagedVacVoiceChannel).toHaveBeenCalledWith(
      interaction,
      "guild-1",
    );
    expect(executeVacRename).toHaveBeenCalledWith(
      interaction,
      "guild-1",
      "voice-1",
    );
    expect(executeVacLimit).not.toHaveBeenCalled();
  });

  it("delegates vc-limit subcommand to executeVacLimit", async () => {
    const interaction = createInteraction({
      subcommand: VAC_COMMAND.SUBCOMMAND.VC_LIMIT,
    });

    await executeVacCommand(interaction as never);

    expect(getManagedVacVoiceChannel).toHaveBeenCalledWith(
      interaction,
      "guild-1",
    );
    expect(executeVacLimit).toHaveBeenCalledWith(
      interaction,
      "guild-1",
      "voice-1",
    );
    expect(executeVacRename).not.toHaveBeenCalled();
  });

  it("delegates invalid subcommand error to handleCommandError", async () => {
    const interaction = createInteraction({ subcommand: "invalid-subcommand" });

    await executeVacCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(executeVacLimit).not.toHaveBeenCalled();
    expect(executeVacRename).not.toHaveBeenCalled();
  });

  it("delegates guard failure to handleCommandError", async () => {
    (getManagedVacVoiceChannel as jest.Mock).mockRejectedValueOnce(
      new Error("not managed"),
    );
    const interaction = createInteraction();

    await executeVacCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(executeVacLimit).not.toHaveBeenCalled();
    expect(executeVacRename).not.toHaveBeenCalled();
  });
});
