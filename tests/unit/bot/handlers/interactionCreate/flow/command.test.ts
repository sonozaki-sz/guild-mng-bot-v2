import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import {
  handleAutocomplete,
  handleChatInputCommand,
} from "@/bot/handlers/interactionCreate/flow/command";

const tDefaultMock = jest.fn((key: string) => `default:${key}`);
const tGuildMock: jest.Mock = jest.fn(async () => "guild:cooldown");
const loggerWarnMock = jest.fn();
const loggerDebugMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tDefault: (key: string, _params?: Record<string, unknown>) =>
    tDefaultMock(key),
  tGuild: (guildId: string, key: string, params?: Record<string, unknown>) =>
    tGuildMock(guildId, key, params),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

jest.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: jest.fn(),
}));

describe("bot/handlers/interactionCreate/flow/command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns when command is not registered", async () => {
    const interaction = { commandName: "unknown" };
    const client = {
      commands: new Map(),
      cooldownManager: { check: jest.fn() },
    };

    await handleChatInputCommand(interaction as never, client as never);

    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
  });

  it("replies cooldown message when user is in cooldown", async () => {
    const interaction = {
      commandName: "ping",
      guildId: "guild-1",
      user: { id: "user-1", tag: "user#0001" },
      reply: jest.fn().mockResolvedValue(undefined),
    };
    const command = {
      data: { name: "ping" },
      execute: jest.fn(),
    };
    const client = {
      commands: new Map([["ping", command]]),
      cooldownManager: { check: jest.fn(() => 2) },
    };

    await handleChatInputCommand(interaction as never, client as never);

    expect(interaction.reply).toHaveBeenCalledWith({
      content: "guild:cooldown",
      flags: 64,
    });
    expect(command.execute).not.toHaveBeenCalled();
  });

  it("delegates execution error to handleCommandError", async () => {
    const error = new Error("execute failed");
    const interaction = {
      commandName: "ping",
      guildId: "guild-1",
      user: { id: "user-1", tag: "user#0001" },
      reply: jest.fn(),
    };
    const command = {
      data: { name: "ping" },
      execute: jest.fn().mockRejectedValue(error),
    };
    const client = {
      commands: new Map([["ping", command]]),
      cooldownManager: { check: jest.fn(() => 0) },
    };

    await handleChatInputCommand(interaction as never, client as never);

    expect(handleCommandError).toHaveBeenCalledWith(interaction, error);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });

  it("runs autocomplete when command supports it", async () => {
    const interaction = { commandName: "ping" };
    const autocomplete = jest.fn().mockResolvedValue(undefined);
    const client = {
      commands: new Map([["ping", { autocomplete }]]),
    };

    await handleAutocomplete(interaction as never, client as never);

    expect(autocomplete).toHaveBeenCalledWith(interaction);
  });
});
