// tests/unit/bot/commands/sticky-message.test.ts
import type { Mock } from "vitest";

const executeStickyMessageCommandMock: Mock = vi.fn();

vi.mock(
  "@/bot/features/sticky-message/commands/stickyMessageCommand.execute",
  () => ({
    executeStickyMessageCommand: executeStickyMessageCommandMock,
  }),
);

describe("bot/commands/sticky-message", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports stickyMessageCommand with expected structure", async () => {
    const { stickyMessageCommand } =
      await import("@/bot/commands/sticky-message");

    expect(stickyMessageCommand).toBeDefined();
    expect(stickyMessageCommand.data).toBeDefined();
    expect(typeof stickyMessageCommand.execute).toBe("function");
    expect(stickyMessageCommand.cooldown).toBe(3);
  });

  it("has correct command name", async () => {
    const { stickyMessageCommand } =
      await import("@/bot/commands/sticky-message");

    expect(stickyMessageCommand.data.name).toBe("sticky-message");
  });

  it("execute calls executeStickyMessageCommand", async () => {
    const { stickyMessageCommand } =
      await import("@/bot/commands/sticky-message");
    const interaction = { id: "int-1" } as never;
    executeStickyMessageCommandMock.mockResolvedValue(undefined);

    await stickyMessageCommand.execute(interaction);

    expect(executeStickyMessageCommandMock).toHaveBeenCalledWith(interaction);
  });

  it("default export equals named export", async () => {
    const mod = await import("@/bot/commands/sticky-message");
    expect(mod.default).toBe(mod.stickyMessageCommand);
  });
});
