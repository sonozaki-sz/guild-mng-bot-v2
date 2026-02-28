// tests/unit/bot/commands/message-delete-config.test.ts
import type { Mock } from "vitest";

const executeMessageDeleteConfigCommandMock: Mock = vi.fn();

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

  // messageDeleteConfigCommand が data・execute を持つオブジェクトとして正しくエクスポートされることを検証
  it("messageDeleteConfigCommand を正しい構造でエクスポートする", async () => {
    const { messageDeleteConfigCommand } =
      await import("@/bot/commands/message-delete-config");

    expect(messageDeleteConfigCommand).toBeDefined();
    expect(messageDeleteConfigCommand.data).toBeDefined();
    expect(typeof messageDeleteConfigCommand.execute).toBe("function");
  });

  // data.name が "message-delete-config" であることを検証
  it("コマンド名が message-delete-config である", async () => {
    const { messageDeleteConfigCommand } =
      await import("@/bot/commands/message-delete-config");

    expect(messageDeleteConfigCommand.data.name).toBe("message-delete-config");
  });

  // execute 呼び出し時に executeMessageDeleteConfigCommand へ interaction が転送されることを検証
  it("execute が executeMessageDeleteConfigCommand を呼ぶ", async () => {
    const { messageDeleteConfigCommand } =
      await import("@/bot/commands/message-delete-config");
    const interaction = { id: "int-1" } as never;
    executeMessageDeleteConfigCommandMock.mockResolvedValue(undefined);

    await messageDeleteConfigCommand.execute(interaction);

    expect(executeMessageDeleteConfigCommandMock).toHaveBeenCalledWith(
      interaction,
    );
  });
});
