import type { Mock } from "vitest";
import { executePingCommand } from "@/bot/features/ping/commands/pingCommand.execute";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";
import { tGuild } from "@/shared/locale/localeManager";

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: vi.fn((description: string) => ({ description })),
}));

function createInteraction() {
  return {
    guildId: "guild-1",
    createdTimestamp: 1_000,
    client: { ws: { ping: 42 } },
    reply: vi.fn().mockResolvedValue(undefined),
    fetchReply: vi.fn().mockResolvedValue({ createdTimestamp: 1_130 }),
    editReply: vi.fn().mockResolvedValue(undefined),
  };
}

describe("bot/features/ping/commands/pingCommand.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replies measuring then edits with latency embed", async () => {
    const interaction = createInteraction();

    (tGuild as Mock)
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

    (tGuild as Mock)
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
