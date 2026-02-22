import { BotClient, createBotClient } from "@/bot/client";
import { logger } from "@/shared/utils/logger";
import { Collection, GatewayIntentBits } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe("bot/client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates BotClient with expected collections and intents", () => {
    const client = new BotClient();

    expect(client.commands).toBeInstanceOf(Collection);
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
    const destroyCooldownSpy = vi
      .spyOn(client.cooldownManager, "destroy")
      .mockImplementation(() => undefined);
    const destroyClientMock = vi.fn().mockResolvedValue(undefined);
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
