import { resolveVacVoiceChannelForEdit } from "@/bot/features/vac/commands/helpers/vacVoiceChannelResolver";
import { executeVacRename } from "@/bot/features/vac/commands/usecases/vacRename";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";
import { MessageFlags } from "discord.js";

jest.mock("@/shared/locale/localeManager", () => ({
  tGuild: jest.fn(
    async (_guildId: string, key: string, params?: Record<string, unknown>) => {
      if (key === "commands:vac.embed.renamed") {
        return `renamed:${String(params?.name)}`;
      }
      return key;
    },
  ),
}));

jest.mock(
  "@/bot/features/vac/commands/helpers/vacVoiceChannelResolver",
  () => ({
    resolveVacVoiceChannelForEdit: jest.fn(),
  }),
);

jest.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: jest.fn((description: string) => ({ description })),
}));

describe("bot/features/vac/commands/usecases/vacRename", () => {
  // VC名変更の成功経路と依存エラー伝播を検証する
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renames channel and replies ephemeral success", async () => {
    const edit = jest.fn().mockResolvedValue(undefined);
    (resolveVacVoiceChannelForEdit as jest.Mock).mockResolvedValue({ edit });

    const reply = jest.fn().mockResolvedValue(undefined);
    const interaction = {
      options: { getString: jest.fn(() => "My VC") },
      reply,
    };

    await executeVacRename(interaction as never, "guild-1", "voice-1");

    expect(edit).toHaveBeenCalledWith({ name: "My VC" });
    expect(createSuccessEmbed).toHaveBeenCalledWith("renamed:My VC");
    expect(reply).toHaveBeenCalledWith({
      embeds: [{ description: "renamed:My VC" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("propagates resolver failure", async () => {
    (resolveVacVoiceChannelForEdit as jest.Mock).mockRejectedValue(
      new Error("not vac channel"),
    );

    const interaction = {
      options: { getString: jest.fn(() => "My VC") },
      reply: jest.fn(),
    };

    await expect(
      executeVacRename(interaction as never, "guild-1", "voice-1"),
    ).rejects.toThrow("not vac channel");
  });
});
