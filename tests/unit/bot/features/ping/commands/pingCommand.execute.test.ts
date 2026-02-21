import { executePingCommand } from "@/bot/features/ping/commands/pingCommand.execute";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";
import { tGuild } from "@/shared/locale";

jest.mock("@/shared/locale", () => ({
  tGuild: jest.fn(),
}));

jest.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: jest.fn((description: string) => ({ description })),
}));

function createInteraction() {
  return {
    guildId: "guild-1",
    createdTimestamp: 1_000,
    client: { ws: { ping: 42 } },
    reply: jest.fn().mockResolvedValue(undefined),
    fetchReply: jest.fn().mockResolvedValue({ createdTimestamp: 1_130 }),
    editReply: jest.fn().mockResolvedValue(undefined),
  };
}

describe("bot/features/ping/commands/pingCommand.execute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("replies measuring then edits with latency embed", async () => {
    const interaction = createInteraction();

    (tGuild as jest.Mock)
      .mockResolvedValueOnce("計測中...")
      .mockResolvedValueOnce("API: 130ms / WS: 42ms");

    await executePingCommand(interaction as never);

    expect(interaction.reply).toHaveBeenCalledWith({ content: "計測中..." });
    expect(createSuccessEmbed).toHaveBeenCalledWith("API: 130ms / WS: 42ms");
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "",
      embeds: [{ description: "API: 130ms / WS: 42ms" }],
    });
  });

  it("passes undefined guildId to translation when interaction guildId is null", async () => {
    const interaction = createInteraction();
    interaction.guildId = null as never;

    (tGuild as jest.Mock)
      .mockResolvedValueOnce("計測中...")
      .mockResolvedValueOnce("API: 130ms / WS: 42ms");

    await executePingCommand(interaction as never);

    expect(tGuild).toHaveBeenNthCalledWith(
      1,
      undefined,
      "commands:ping.embed.measuring",
    );
  });
});
