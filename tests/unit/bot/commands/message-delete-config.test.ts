// tests/unit/bot/commands/message-delete-config.test.ts

const executeMessageDeleteConfigCommandMock = vi.fn();

vi.mock(
  "@/bot/features/message-delete/commands/messageDeleteConfigCommand.execute",
  () => ({
    executeMessageDeleteConfigCommand: executeMessageDeleteConfigCommandMock,
  }),
);

describe("bot/commands/message-delete-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("messageDeleteConfigCommand を正しい構造でエクスポートする", async () => {
    const { messageDeleteConfigCommand } = await import(
      "@/bot/commands/message-delete-config"
    );

    expect(messageDeleteConfigCommand).toBeDefined();
    expect(messageDeleteConfigCommand.data).toBeDefined();
    expect(typeof messageDeleteConfigCommand.execute).toBe("function");
  });

  it("コマンド名が message-delete-config である", async () => {
    const { messageDeleteConfigCommand } = await import(
      "@/bot/commands/message-delete-config"
    );

    expect(messageDeleteConfigCommand.data.name).toBe("message-delete-config");
  });

  it("execute が executeMessageDeleteConfigCommand を呼ぶ", async () => {
    const { messageDeleteConfigCommand } = await import(
      "@/bot/commands/message-delete-config"
    );
    const interaction = { id: "int-1" } as never;
    executeMessageDeleteConfigCommandMock.mockResolvedValue(undefined);

    await messageDeleteConfigCommand.execute(interaction);

    expect(executeMessageDeleteConfigCommandMock).toHaveBeenCalledWith(
      interaction,
    );
  });
});
