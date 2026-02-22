import type { Mock } from "vitest";
import { presentVacConfigShow } from "@/bot/features/vac/commands/presenters/vacConfigShowPresenter";
import { handleVacConfigShow } from "@/bot/features/vac/commands/usecases/vacConfigShow";
import { getBotVacRepository } from "@/bot/services/botVacDependencyResolver";
import { createInfoEmbed } from "@/bot/utils/messageResponse";
import { ValidationError } from "@/shared/errors/customErrors";
import { MessageFlags } from "discord.js";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
}));

vi.mock("@/bot/services/botVacDependencyResolver", () => ({
  getBotVacRepository: vi.fn(),
}));

vi.mock(
  "@/bot/features/vac/commands/presenters/vacConfigShowPresenter",
  () => ({
    presentVacConfigShow: vi.fn(),
  }),
);

vi.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: vi.fn((description: string, options?: object) => ({
    description,
    options,
  })),
}));

describe("bot/features/vac/commands/usecases/vacConfigShow", () => {
  // show ユースケースの前提チェックと返信ペイロードを検証
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ValidationError when guild context is missing", async () => {
    const interaction = {
      guild: null,
      reply: vi.fn(),
    };

    await expect(
      handleVacConfigShow(interaction as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("builds info embed and replies ephemeral when guild exists", async () => {
    const getVacConfigOrDefault = vi.fn().mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    });
    (getBotVacRepository as Mock).mockReturnValue({
      getVacConfigOrDefault,
    });

    (presentVacConfigShow as Mock).mockResolvedValue({
      title: "VAC設定",
      fieldTrigger: "トリガー",
      triggerChannels: "<#trigger-1> (TOP)",
      fieldCreatedDetails: "作成済みVC",
      createdVcDetails: "作成済みVCなし",
    });

    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      guild: { id: "guild-1" },
      reply,
    };

    await handleVacConfigShow(interaction as never, "guild-1");

    expect(getVacConfigOrDefault).toHaveBeenCalledWith("guild-1");
    expect(presentVacConfigShow).toHaveBeenCalledWith(
      interaction.guild,
      "guild-1",
      {
        enabled: true,
        triggerChannelIds: ["trigger-1"],
        createdChannels: [],
      },
    );

    expect(createInfoEmbed).toHaveBeenCalledWith("", {
      title: "VAC設定",
      fields: [
        {
          name: "トリガー",
          value: "<#trigger-1> (TOP)",
          inline: false,
        },
        {
          name: "作成済みVC",
          value: "作成済みVCなし",
          inline: false,
        },
      ],
    });

    expect(reply).toHaveBeenCalledWith({
      embeds: [{ description: "", options: expect.any(Object) }],
      flags: MessageFlags.Ephemeral,
    });
  });
});
