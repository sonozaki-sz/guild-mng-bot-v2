// tests/unit/bot/commands/member-log-config.test.ts

const executeMemberLogConfigCommandMock = vi.fn();

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.execute",
  () => ({
    executeMemberLogConfigCommand: executeMemberLogConfigCommandMock,
  }),
);

describe("bot/commands/member-log-config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // memberLogConfigCommand が data・execute を持つオブジェクトとして正しく
  // エクスポートされることを検証
  it("memberLogConfigCommand を正しい構造でエクスポートする", async () => {
    const { memberLogConfigCommand } =
      await import("@/bot/commands/member-log-config");

    expect(memberLogConfigCommand).toBeDefined();
    expect(memberLogConfigCommand.data).toBeDefined();
    expect(typeof memberLogConfigCommand.execute).toBe("function");
  });

  // data.name が "member-log-config" であることを検証
  it("コマンド名が member-log-config である", async () => {
    const { memberLogConfigCommand } =
      await import("@/bot/commands/member-log-config");

    expect(memberLogConfigCommand.data.name).toBe("member-log-config");
  });

  // execute 呼び出し時に executeMemberLogConfigCommand へ interaction が転送されることを検証
  it("execute が executeMemberLogConfigCommand を呼ぶ", async () => {
    const { memberLogConfigCommand } =
      await import("@/bot/commands/member-log-config");
    const interaction = { id: "int-1" } as never;
    executeMemberLogConfigCommandMock.mockResolvedValue(undefined);

    await memberLogConfigCommand.execute(interaction);

    expect(executeMemberLogConfigCommandMock).toHaveBeenCalledWith(interaction);
  });
});
