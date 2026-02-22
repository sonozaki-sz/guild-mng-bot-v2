import { presentVacConfigView } from "@/bot/features/vac/commands/presenters/vacConfigViewPresenter";
import type { VacConfig } from "@/shared/database/types";
import { ChannelType } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(async (_guildId: string, key: string) => {
    const labels: Record<string, string> = {
      "commands:vac-config.embed.top": "TOP",
      "commands:vac-config.embed.not_configured": "未設定",
      "commands:vac-config.embed.no_created_vcs": "作成済みVCなし",
      "commands:vac-config.embed.title": "VAC設定",
      "commands:vac-config.embed.field.trigger_channels": "トリガー",
      "commands:vac-config.embed.field.created_vc_details": "作成済みVC",
    };
    return labels[key] ?? key;
  }),
}));

describe("bot/features/vac/commands/presenters/vacConfigViewPresenter", () => {
  // view 表示用の文言整形と空状態フォールバックを検証する
  it("formats trigger channels and created vc details", async () => {
    const guild = {
      channels: {
        fetch: vi
          .fn()
          .mockResolvedValueOnce({
            id: "trigger-1",
            parent: { type: ChannelType.GuildCategory, name: "CategoryA" },
          })
          .mockResolvedValueOnce({
            id: "trigger-2",
            parent: null,
          }),
      },
    };

    const config: VacConfig = {
      enabled: true,
      triggerChannelIds: ["trigger-1", "trigger-2"],
      createdChannels: [
        {
          voiceChannelId: "voice-1",
          ownerId: "user-1",
          createdAt: Date.now(),
        },
      ],
    };

    const result = await presentVacConfigView(
      guild as never,
      "guild-1",
      config,
    );

    expect(result.title).toBe("VAC設定");
    expect(result.fieldTrigger).toBe("トリガー");
    expect(result.fieldCreatedDetails).toBe("作成済みVC");
    expect(result.triggerChannels).toContain("<#trigger-1> (CategoryA)");
    expect(result.triggerChannels).toContain("<#trigger-2> (TOP)");
    expect(result.createdVcDetails).toBe("<#voice-1>(<@user-1>)");
  });

  it("uses fallback labels when config has no channels", async () => {
    const guild = {
      channels: {
        fetch: vi.fn(),
      },
    };

    const config: VacConfig = {
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [],
    };

    const result = await presentVacConfigView(
      guild as never,
      "guild-1",
      config,
    );

    expect(result.triggerChannels).toBe("未設定");
    expect(result.createdVcDetails).toBe("作成済みVCなし");
    expect(guild.channels.fetch).not.toHaveBeenCalled();
  });
});
