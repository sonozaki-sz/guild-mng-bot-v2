// tests/unit/bot/features/member-log/commands/memberLogConfigCommand.view.test.ts
import { handleMemberLogConfigView } from "@/bot/features/member-log/commands/memberLogConfigCommand.view";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----
const ensurePermissionMock = vi.fn();
const getMemberLogConfigMock = vi.fn();
const tGuildMock = vi.fn(async (_guildId: string, key: string) => key);
const createInfoEmbedMock = vi.fn(
  (desc: string, opts?: { title?: string; fields?: unknown[] }) => ({
    description: desc,
    title: opts?.title,
    fields: opts?.fields,
  }),
);

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.guard",
  () => ({
    ensureMemberLogManageGuildPermission: (...args: unknown[]) =>
      ensurePermissionMock(...args),
  }),
);

vi.mock("@/bot/services/botMemberLogDependencyResolver", () => ({
  getBotMemberLogConfigService: () => ({
    getMemberLogConfig: (...args: unknown[]) => getMemberLogConfigMock(...args),
  }),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tGuild: (guildId: string, key: string) => tGuildMock(guildId, key),
}));

vi.mock("@/bot/utils/messageResponse", () => ({
  createInfoEmbed: (
    desc: string,
    opts?: { title?: string; fields?: unknown[] },
  ) => createInfoEmbedMock(desc, opts),
}));

// ---- ヘルパー ----

/** テスト用 interaction モックを生成する */
function makeInteraction() {
  return { reply: vi.fn().mockResolvedValue(undefined) };
}

// handleMemberLogConfigView の設定表示ロジックを検証
describe("bot/features/member-log/commands/memberLogConfigCommand.view", () => {
  // 各テストでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ガードが ValidationError を投げた場合にそれが伝播することを確認
  it("propagates error when guard throws", async () => {
    ensurePermissionMock.mockRejectedValue(new ValidationError("no-perm"));

    await expect(
      handleMemberLogConfigView(makeInteraction() as never, "guild-1"),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  // config が null の場合に "not_configured" メッセージで reply が呼ばれることを確認
  it("replies with not_configured info embed when config is null", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue(null);
    tGuildMock.mockImplementation(async (_guildId: string, key: string) => key);
    const interaction = makeInteraction();

    await handleMemberLogConfigView(interaction as never, "guild-1");

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
    expect(createInfoEmbedMock).toHaveBeenCalledWith(
      "commands:member-log-config.embed.not_configured",
      expect.objectContaining({
        title: "commands:member-log-config.embed.title",
      }),
    );
  });

  // config が存在する場合に fields を含む info embed が表示されることを確認
  it("replies with config fields when config exists", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "ch-1",
      joinMessage: "こんにちは",
      leaveMessage: "さようなら",
    });
    tGuildMock.mockImplementation(async (_guildId: string, key: string) => key);
    const interaction = makeInteraction();

    await handleMemberLogConfigView(interaction as never, "guild-1");

    expect(createInfoEmbedMock).toHaveBeenCalledWith(
      "",
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({
            name: "commands:member-log-config.embed.field.status",
          }),
          expect.objectContaining({
            name: "commands:member-log-config.embed.field.channel",
          }),
          expect.objectContaining({
            name: "commands:member-log-config.embed.field.join_message",
          }),
          expect.objectContaining({
            name: "commands:member-log-config.embed.field.leave_message",
          }),
        ]),
      }),
    );
  });

  // config.enabled が true の場合に labelEnabled が使用されることを確認
  it("uses labelEnabled when config.enabled is true", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "ch-1",
      joinMessage: null,
      leaveMessage: null,
    });
    tGuildMock.mockImplementation(async (_guildId: string, key: string) => key);
    const interaction = makeInteraction();

    await handleMemberLogConfigView(interaction as never, "guild-1");

    const callArg = createInfoEmbedMock.mock.calls[0][1];
    const statusField = (
      callArg.fields as Array<{ name: string; value: string }>
    ).find((f) => f.name === "commands:member-log-config.embed.field.status");
    expect(statusField?.value).toBe("common:enabled");
  });

  // config.enabled が false の場合に labelDisabled が使用されることを確認
  it("uses labelDisabled when config.enabled is false", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: false,
      channelId: "ch-1",
      joinMessage: null,
      leaveMessage: null,
    });
    tGuildMock.mockImplementation(async (_guildId: string, key: string) => key);
    const interaction = makeInteraction();

    await handleMemberLogConfigView(interaction as never, "guild-1");

    const callArg = createInfoEmbedMock.mock.calls[0][1];
    const statusField = (
      callArg.fields as Array<{ name: string; value: string }>
    ).find((f) => f.name === "commands:member-log-config.embed.field.status");
    expect(statusField?.value).toBe("common:disabled");
  });

  // channelId が設定されている場合にチャンネルメンションが表示されることを確認
  it("shows channel mention when channelId is set", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: true,
      channelId: "ch-99",
      joinMessage: null,
      leaveMessage: null,
    });
    tGuildMock.mockImplementation(async (_guildId: string, key: string) => key);
    const interaction = makeInteraction();

    await handleMemberLogConfigView(interaction as never, "guild-1");

    const callArg = createInfoEmbedMock.mock.calls[0][1];
    const channelField = (
      callArg.fields as Array<{ name: string; value: string }>
    ).find((f) => f.name === "commands:member-log-config.embed.field.channel");
    expect(channelField?.value).toBe("<#ch-99>");
  });

  // joinMessage が null の場合に labelNone が表示されることを確認
  it("shows labelNone when joinMessage is null", async () => {
    ensurePermissionMock.mockResolvedValue(undefined);
    getMemberLogConfigMock.mockResolvedValue({
      enabled: false,
      channelId: null,
      joinMessage: null,
      leaveMessage: null,
    });
    tGuildMock.mockImplementation(async (_guildId: string, key: string) => key);
    const interaction = makeInteraction();

    await handleMemberLogConfigView(interaction as never, "guild-1");

    const callArg = createInfoEmbedMock.mock.calls[0][1];
    const joinField = (
      callArg.fields as Array<{ name: string; value: string }>
    ).find(
      (f) => f.name === "commands:member-log-config.embed.field.join_message",
    );
    expect(joinField?.value).toBe("common:none");
  });
});
