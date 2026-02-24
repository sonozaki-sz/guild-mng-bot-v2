// tests/unit/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler.test.ts

const findByChannelMock = vi.fn();
const tGuildMock = vi.fn(
  async (_guildId: string | undefined, key: string) => `[${key}]`,
);

const warningEmbedMock = vi.fn((msg: string, opts?: object) => ({
  type: "warning",
  msg,
  ...opts,
}));
const infoEmbedInstance = {
  setColor: vi.fn().mockReturnThis(),
  setTimestamp: vi.fn().mockReturnThis(),
};
const infoEmbedMock = vi.fn(() => infoEmbedInstance);

vi.mock("@/bot/services/botStickyMessageDependencyResolver", () => ({
  getBotStickyMessageConfigService: vi.fn(() => ({
    findByChannel: findByChannelMock,
  })),
}));
vi.mock("@/shared/locale/localeManager", () => ({ tGuild: tGuildMock }));
vi.mock("@/bot/utils/messageResponse", () => ({
  createWarningEmbed: warningEmbedMock,
  createInfoEmbed: infoEmbedMock,
}));

function createInteractionMock({
  guildId = "guild-1",
  values = ["ch-1"] as string[],
  messageComponents = [{ type: 3 }],
  updateMock = vi.fn().mockResolvedValue(undefined),
}: {
  guildId?: string | null;
  values?: string[];
  messageComponents?: unknown[];
  updateMock?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    guildId,
    values,
    update: updateMock,
    message: { components: messageComponents },
    _updateMock: updateMock,
  };
}

describe("bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    infoEmbedMock.mockReturnValue(infoEmbedInstance);
    infoEmbedInstance.setColor.mockReturnThis();
    infoEmbedInstance.setTimestamp.mockReturnThis();
  });

  it("matches VIEW_SELECT_CUSTOM_ID exactly", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    expect(
      stickyMessageViewSelectHandler.matches("sticky-message:view-select"),
    ).toBe(true);
    expect(
      stickyMessageViewSelectHandler.matches(
        "sticky-message:view-select:extra",
      ),
    ).toBe(false);
  });

  it("calls update with empty components when no channelId", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({
      values: [],
      updateMock,
    });

    await stickyMessageViewSelectHandler.execute(interaction as never);

    expect(updateMock).toHaveBeenCalledWith({ components: [] });
    expect(findByChannelMock).not.toHaveBeenCalled();
  });

  it("updates with warning when sticky not found", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    findByChannelMock.mockResolvedValue(null);
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({ updateMock });

    await stickyMessageViewSelectHandler.execute(interaction as never);

    expect(warningEmbedMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ components: expect.any(Array) }),
    );
  });

  it("shows plain format for sticky without embedData", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      channelId: "ch-1",
      content: "Hello world",
      embedData: null,
      updatedAt: new Date("2025-01-01T00:00:00Z"),
      updatedBy: null,
    });
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({ updateMock });

    await stickyMessageViewSelectHandler.execute(interaction as never);

    expect(infoEmbedMock).toHaveBeenCalled();
    const formatArg = tGuildMock.mock.calls.some((c) =>
      String(c[1]).includes("format_plain"),
    );
    expect(formatArg).toBe(true);
    expect(infoEmbedInstance.setColor).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: [infoEmbedInstance] }),
    );
  });

  it("shows embed format, title, and color fields for sticky with embedData", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    const embedData = JSON.stringify({
      title: "Embed Title",
      color: 0xff0000,
    });
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      channelId: "ch-1",
      content: "Embed content",
      embedData,
      updatedAt: new Date("2025-01-01T00:00:00Z"),
      updatedBy: null,
    });
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({ updateMock });

    await stickyMessageViewSelectHandler.execute(interaction as never);

    expect(infoEmbedMock).toHaveBeenCalled();
    expect(infoEmbedInstance.setColor).toHaveBeenCalledWith(0xff0000);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: [infoEmbedInstance] }),
    );
  });

  it("shows updatedBy field when updatedBy is set", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      channelId: "ch-1",
      content: "Content",
      embedData: null,
      updatedAt: new Date("2025-01-01T00:00:00Z"),
      updatedBy: "user-1",
    });
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({ updateMock });

    await stickyMessageViewSelectHandler.execute(interaction as never);

    const tGuildCalls = tGuildMock.mock.calls.map((c) => c[1]);
    expect(tGuildCalls.some((k) => String(k).includes("updated_by"))).toBe(
      true,
    );
  });

  it("truncates content longer than 1024 chars", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    const longContent = "a".repeat(1100);
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      channelId: "ch-1",
      content: longContent,
      embedData: null,
      updatedAt: new Date("2025-01-01T00:00:00Z"),
      updatedBy: null,
    });
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({ updateMock });

    await stickyMessageViewSelectHandler.execute(interaction as never);

    const infoCall = infoEmbedMock.mock.calls[0];
    const opts = infoCall?.[1] as { fields?: { value: string }[] };
    const contentField = opts?.fields?.find((f) => f.value.includes("..."));
    expect(contentField).toBeDefined();
  });

  it("does not truncate content equal to 1024 chars", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    const exactContent = "a".repeat(1024);
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      channelId: "ch-1",
      content: exactContent,
      embedData: null,
      updatedAt: new Date("2025-01-01T00:00:00Z"),
      updatedBy: null,
    });
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({ updateMock });

    await stickyMessageViewSelectHandler.execute(interaction as never);

    const opts = infoEmbedMock.mock.calls[0]?.[1] as {
      fields?: { value: string }[];
    };
    const contentField = opts?.fields?.find((f) => f.value.includes("aaa"));
    expect(contentField?.value).not.toContain("...");
  });

  it("ignores JSON parse errors in embedData", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      channelId: "ch-1",
      content: "Content",
      embedData: "not-valid-json",
      updatedAt: new Date("2025-01-01T00:00:00Z"),
      updatedBy: null,
    });
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({ updateMock });

    await expect(
      stickyMessageViewSelectHandler.execute(interaction as never),
    ).resolves.not.toThrow();
    expect(updateMock).toHaveBeenCalled();
  });

  it("treats guildId as undefined when null (null-coalescing fallback)", async () => {
    const { stickyMessageViewSelectHandler } =
      await import("@/bot/features/sticky-message/handlers/ui/stickyMessageViewSelectHandler");
    findByChannelMock.mockResolvedValue({
      id: "sticky-1",
      channelId: "ch-1",
      content: "Sticky content",
      embedData: null,
      updatedAt: new Date("2025-01-01T00:00:00Z"),
      updatedBy: null,
    });
    const updateMock = vi.fn().mockResolvedValue(undefined);
    const interaction = createInteractionMock({ guildId: null, updateMock });

    await stickyMessageViewSelectHandler.execute(interaction as never);

    expect(updateMock).toHaveBeenCalled();
  });
});
