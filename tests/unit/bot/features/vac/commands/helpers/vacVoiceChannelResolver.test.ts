import { resolveVacVoiceChannelForEdit } from "@/bot/features/vac/commands/helpers/vacVoiceChannelResolver";
import { ValidationError } from "@/shared/errors";
import { tGuild } from "@/shared/locale";
import { ChannelType } from "discord.js";

jest.mock("@/shared/locale", () => ({
  tGuild: jest.fn(async (_guildId: string, key: string) => key),
}));

describe("bot/features/vac/commands/helpers/vacVoiceChannelResolver", () => {
  // 編集対象VCの解決条件とエラー分岐を検証する
  it("returns guild voice channel when target channel is valid", async () => {
    const voiceChannel = {
      id: "voice-1",
      type: ChannelType.GuildVoice,
    };
    const interaction = {
      guild: {
        channels: {
          fetch: jest.fn().mockResolvedValue(voiceChannel),
        },
      },
    };

    const result = await resolveVacVoiceChannelForEdit(
      interaction as never,
      "guild-1",
      "voice-1",
    );

    expect(result).toBe(voiceChannel);
  });

  it("throws ValidationError when channel is missing", async () => {
    const interaction = {
      guild: {
        channels: {
          fetch: jest.fn().mockResolvedValue(null),
        },
      },
    };

    await expect(
      resolveVacVoiceChannelForEdit(interaction as never, "guild-1", "x"),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(tGuild).toHaveBeenCalledWith(
      "guild-1",
      "errors:vac.not_vac_channel",
    );
  });

  it("throws ValidationError when channel is not voice", async () => {
    const interaction = {
      guild: {
        channels: {
          fetch: jest.fn().mockResolvedValue({
            id: "text-1",
            type: ChannelType.GuildText,
          }),
        },
      },
    };

    await expect(
      resolveVacVoiceChannelForEdit(interaction as never, "guild-1", "text-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
