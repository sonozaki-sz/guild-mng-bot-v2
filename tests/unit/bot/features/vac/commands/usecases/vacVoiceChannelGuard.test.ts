// tests/unit/bot/features/vac/commands/usecases/vacVoiceChannelGuard.test.ts
import type { Mock } from "vitest";
import { getManagedVacVoiceChannel } from "@/bot/features/vac/commands/usecases/vacVoiceChannelGuard";
import { getBotVacRepository } from "@/bot/services/botVacDependencyResolver";
import { ValidationError } from "@/shared/errors/customErrors";
import { ChannelType } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(async (_guildId: string, key: string) => key),
}));

vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: vi.fn(),
}));

describe("bot/features/vac/commands/usecases/vacVoiceChannelGuard", () => {
  // 実行者VCの存在確認と管理対象判定の分岐を検証する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ValidationError when member is not in a voice channel", async () => {
    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: { channel: null },
          }),
        },
      },
    };

    await expect(
      getManagedVacVoiceChannel(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError when current voice channel is not managed VAC", async () => {
    (getBotVacRepository as Mock).mockReturnValue({
      isManagedVacChannel: vi.fn().mockResolvedValue(false),
    });

    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
      },
    };

    await expect(
      getManagedVacVoiceChannel(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("returns voice channel id when user is in managed VAC channel", async () => {
    const isManagedVacChannel = vi.fn().mockResolvedValue(true);
    (getBotVacRepository as Mock).mockReturnValue({
      isManagedVacChannel,
    });

    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: {
              channel: { id: "voice-1", type: ChannelType.GuildVoice },
            },
          }),
        },
      },
    };

    const result = await getManagedVacVoiceChannel(
      interaction as never,
      "guild-1",
    );

    expect(result).toEqual({ id: "voice-1" });
    expect(isManagedVacChannel).toHaveBeenCalledWith("guild-1", "voice-1");
  });
});
