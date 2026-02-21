import { getManagedVacVoiceChannel } from "@/bot/features/vac/commands/usecases/vacVoiceChannelGuard";
import { getBotVacRepository } from "@/bot/services/botVacDependencyResolver";
import { ValidationError } from "@/shared/errors";
import { ChannelType } from "discord.js";

jest.mock("@/shared/locale", () => ({
  tGuild: jest.fn(async (_guildId: string, key: string) => key),
}));

jest.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: jest.fn(),
}));

describe("bot/features/vac/commands/usecases/vacVoiceChannelGuard", () => {
  // 実行者VCの存在確認と管理対象判定の分岐を検証する
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws ValidationError when member is not in a voice channel", async () => {
    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
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
    (getBotVacRepository as jest.Mock).mockReturnValue({
      isManagedVacChannel: jest.fn().mockResolvedValue(false),
    });

    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
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
    const isManagedVacChannel = jest.fn().mockResolvedValue(true);
    (getBotVacRepository as jest.Mock).mockReturnValue({
      isManagedVacChannel,
    });

    const interaction = {
      user: { id: "user-1" },
      guild: {
        members: {
          fetch: jest.fn().mockResolvedValue({
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
