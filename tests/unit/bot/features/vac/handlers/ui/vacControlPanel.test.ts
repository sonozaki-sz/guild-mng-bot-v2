import {
  VAC_PANEL_CUSTOM_ID,
  getVacPanelChannelId,
  sendVacControlPanel,
} from "@/bot/features/vac/handlers/ui/vacControlPanel";
import { createInfoEmbed } from "@/bot/utils/messageResponse";
import { tGuild } from "@/shared/locale/localeManager";

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: vi.fn(async (_guildId: string, key: string) => key),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: vi.fn(
    (description: string, options?: { title?: string }) => ({
      description,
      title: options?.title,
    }),
  ),
}));

describe("bot/features/vac/handlers/ui/vacControlPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts channel id from custom id with expected prefix", () => {
    expect(
      getVacPanelChannelId(
        "vac:rename:voice-1",
        VAC_PANEL_CUSTOM_ID.RENAME_BUTTON_PREFIX,
      ),
    ).toBe("voice-1");
  });

  it("returns empty string when custom id does not match prefix", () => {
    expect(
      getVacPanelChannelId(
        "vac:limit:voice-1",
        VAC_PANEL_CUSTOM_ID.RENAME_BUTTON_PREFIX,
      ),
    ).toBe("");
  });

  it("returns early when voice channel is not text based", async () => {
    const send = vi.fn();
    const voiceChannel = {
      id: "voice-1",
      guild: { id: "guild-1" },
      isTextBased: vi.fn(() => false),
      isSendable: vi.fn(() => true),
      send,
    };

    await sendVacControlPanel(voiceChannel as never);

    expect(voiceChannel.isSendable).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("returns early when voice channel is not sendable", async () => {
    const send = vi.fn();
    const voiceChannel = {
      id: "voice-1",
      guild: { id: "guild-1" },
      isTextBased: vi.fn(() => true),
      isSendable: vi.fn(() => false),
      send,
    };

    await sendVacControlPanel(voiceChannel as never);

    expect(send).not.toHaveBeenCalled();
  });

  it("sends VAC control panel with four button rows", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const voiceChannel = {
      id: "voice-1",
      guild: { id: "guild-1" },
      isTextBased: vi.fn(() => true),
      isSendable: vi.fn(() => true),
      send,
    };

    await sendVacControlPanel(voiceChannel as never);

    expect(tGuild).toHaveBeenCalledWith("guild-1", "commands:vac.panel.title");
    expect(createInfoEmbed).toHaveBeenCalledWith(
      "commands:vac.panel.description",
      {
        title: "commands:vac.panel.title",
      },
    );

    expect(send).toHaveBeenCalledTimes(1);
    const payload = send.mock.calls[0][0];
    expect(payload.embeds).toHaveLength(1);
    expect(payload.components).toHaveLength(4);
    expect(payload.components[0].toJSON().components[0].custom_id).toBe(
      `${VAC_PANEL_CUSTOM_ID.RENAME_BUTTON_PREFIX}voice-1`,
    );
    expect(payload.components[1].toJSON().components[0].custom_id).toBe(
      `${VAC_PANEL_CUSTOM_ID.LIMIT_BUTTON_PREFIX}voice-1`,
    );
    expect(payload.components[2].toJSON().components[0].custom_id).toBe(
      `${VAC_PANEL_CUSTOM_ID.AFK_BUTTON_PREFIX}voice-1`,
    );
    expect(payload.components[3].toJSON().components[0].custom_id).toBe(
      `${VAC_PANEL_CUSTOM_ID.REFRESH_BUTTON_PREFIX}voice-1`,
    );
  });
});
