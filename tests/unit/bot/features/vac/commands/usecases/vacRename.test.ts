// tests/unit/bot/features/vac/commands/usecases/vacRename.test.ts
import type { Mock } from "vitest";
import { resolveVacVoiceChannelForEdit } from "@/bot/features/vac/commands/helpers/vacVoiceChannelResolver";
import { executeVacRename } from "@/bot/features/vac/commands/usecases/vacRename";
import { createSuccessEmbed } from "@/bot/utils/messageResponse";
import { MessageFlags } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(
    async (_guildId: string, key: string, params?: Record<string, unknown>) => {
      if (key === "commands:vac.embed.renamed") {
        return `renamed:${String(params?.name)}`;
      }
      return key;
    },
  ),
}));

vi.mock(
  "@/bot/features/vac/commands/helpers/vacVoiceChannelResolver",
  () => ({
    resolveVacVoiceChannelForEdit: vi.fn(),
  }),
);

vi.mock("@/bot/utils/messageResponse", () => ({
  createSuccessEmbed: vi.fn((description: string) => ({ description })),
}));

describe("bot/features/vac/commands/usecases/vacRename", () => {
  // VC名変更の成功経路と依存エラー伝播を検証する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renames channel and replies ephemeral success", async () => {
    const edit = vi.fn().mockResolvedValue(undefined);
    (resolveVacVoiceChannelForEdit as Mock).mockResolvedValue({ edit });

    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      options: { getString: vi.fn(() => "My VC") },
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
    (resolveVacVoiceChannelForEdit as Mock).mockRejectedValue(
      new Error("not vac channel"),
    );

    const interaction = {
      options: { getString: vi.fn(() => "My VC") },
      reply: vi.fn(),
    };

    await expect(
      executeVacRename(interaction as never, "guild-1", "voice-1"),
    ).rejects.toThrow("not vac channel");
  });
});
