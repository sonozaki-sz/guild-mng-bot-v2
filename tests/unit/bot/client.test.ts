import { Collection, GatewayIntentBits } from "discord.js";
import { BotClient, createBotClient } from "../../../src/bot/client";
import { logger } from "../../../src/shared/utils/logger";

jest.mock("../../../src/shared/locale", () => ({
  tDefault: jest.fn((key: string) => key),
}));

jest.mock("../../../src/shared/utils/logger", () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe("bot/client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates BotClient with expected collections and intents", () => {
    const client = new BotClient();

    expect(client.commands).toBeInstanceOf(Collection);
    expect(client.modals).toBeInstanceOf(Collection);
    expect(client.cooldownManager).toBeDefined();
    expect(client.options.intents.has(GatewayIntentBits.Guilds)).toBe(true);
    expect(client.options.intents.has(GatewayIntentBits.MessageContent)).toBe(
      true,
    );
    expect(client.options.intents.has(GatewayIntentBits.GuildMessages)).toBe(
      true,
    );
    expect(client.options.intents.has(GatewayIntentBits.GuildMembers)).toBe(
      true,
    );
    expect(client.options.intents.has(GatewayIntentBits.GuildVoiceStates)).toBe(
      true,
    );
  });

  it("createBotClient logs initialized message", () => {
    const client = createBotClient();

    expect(client).toBeInstanceOf(BotClient);
    expect(logger.info).toHaveBeenCalledWith("system:bot.client.initialized");
  });

  it("shutdown destroys cooldown manager and client with logs", async () => {
    const client = new BotClient();
    const destroyCooldownSpy = jest
      .spyOn(client.cooldownManager, "destroy")
      .mockImplementation(() => undefined);
    const destroyClientMock = jest.fn().mockResolvedValue(undefined);
    (client as unknown as { destroy: () => Promise<void> }).destroy =
      destroyClientMock;

    await client.shutdown();

    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      "system:bot.client.shutting_down",
    );
    expect(destroyCooldownSpy).toHaveBeenCalledTimes(1);
    expect(destroyClientMock).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      "system:bot.client.shutdown_complete",
    );
  });
});
