// tests/unit/bot/commands/message-delete.test.ts

const executeMessageDeleteCommandMock = vi.fn();

vi.mock(
  "@/bot/features/message-delete/commands/messageDeleteCommand.execute",
  () => ({
    executeMessageDeleteCommand: executeMessageDeleteCommandMock,
  }),
);

describe("bot/commands/message-delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("messageDeleteCommand を正しい構造でエクスポートする", async () => {
    const { messageDeleteCommand } = await import(
      "@/bot/commands/message-delete"
    );

    expect(messageDeleteCommand).toBeDefined();
    expect(messageDeleteCommand.data).toBeDefined();
    expect(typeof messageDeleteCommand.execute).toBe("function");
    expect(messageDeleteCommand.cooldown).toBe(5);
  });

  it("コマンド名が message-delete である", async () => {
    const { messageDeleteCommand } = await import(
      "@/bot/commands/message-delete"
    );

    expect(messageDeleteCommand.data.name).toBe("message-delete");
  });

  it("execute が executeMessageDeleteCommand を呼ぶ", async () => {
    const { messageDeleteCommand } = await import(
      "@/bot/commands/message-delete"
    );
    const interaction = { id: "int-1" } as never;
    executeMessageDeleteCommandMock.mockResolvedValue(undefined);

    await messageDeleteCommand.execute(interaction);

    expect(executeMessageDeleteCommandMock).toHaveBeenCalledWith(interaction);
  });
});
