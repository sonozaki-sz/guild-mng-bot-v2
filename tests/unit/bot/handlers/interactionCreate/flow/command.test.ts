import type { Mock } from "vitest";
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import {
  handleAutocomplete,
  handleChatInputCommand,
} from "@/bot/handlers/interactionCreate/flow/command";

const tDefaultMock = vi.fn((key: string) => `default:${key}`);
const tGuildMock: Mock = vi.fn(async () => "guild:cooldown");
const loggerWarnMock = vi.fn();
const loggerDebugMock = vi.fn();
const loggerErrorMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string, _params?: Record<string, unknown>) =>
    tDefaultMock(key),
  tGuild: (guildId: string, key: string, params?: Record<string, unknown>) =>
    tGuildMock(guildId, key, params),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

describe("bot/handlers/interactionCreate/flow/command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns when command is not registered", async () => {
    const interaction = { commandName: "unknown" };
    const client = {
      commands: new Map(),
      cooldownManager: { check: vi.fn() },
    };

    await handleChatInputCommand(interaction as never, client as never);

    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
  });

  it("replies cooldown message when user is in cooldown", async () => {
    const interaction = {
      commandName: "ping",
      guildId: "guild-1",
      user: { id: "user-1", tag: "user#0001" },
      reply: vi.fn().mockResolvedValue(undefined),
    };
    const command = {
      data: { name: "ping" },
      execute: vi.fn(),
    };
    const client = {
      commands: new Map([["ping", command]]),
      cooldownManager: { check: vi.fn(() => 2) },
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
      reply: vi.fn(),
    };
    const command = {
      data: { name: "ping" },
      execute: vi.fn().mockRejectedValue(error),
    };
    const client = {
      commands: new Map([["ping", command]]),
      cooldownManager: { check: vi.fn(() => 0) },
    };

    await handleChatInputCommand(interaction as never, client as never);

    expect(handleCommandError).toHaveBeenCalledWith(interaction, error);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });

  it("runs autocomplete when command supports it", async () => {
    const interaction = { commandName: "ping" };
    const autocomplete = vi.fn().mockResolvedValue(undefined);
    const client = {
      commands: new Map([["ping", { autocomplete }]]),
    };

    await handleAutocomplete(interaction as never, client as never);

    expect(autocomplete).toHaveBeenCalledWith(interaction);
  });
});
