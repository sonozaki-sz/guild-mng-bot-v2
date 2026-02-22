import { handleInteractionError } from "@/bot/errors/interactionErrorHandler";
import {
  handleButton,
  handleStringSelectMenu,
  handleUserSelectMenu,
} from "@/bot/handlers/interactionCreate/flow/components";
import type { Mock } from "vitest";

const loggerErrorMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleInteractionError: vi.fn(),
}));

vi.mock("@/bot/handlers/interactionCreate/ui/buttons", () => ({
  buttonHandlers: [
    {
      matches: vi.fn((id: string) => id === "target"),
      execute: vi.fn().mockResolvedValue(undefined),
    },
    {
      matches: vi.fn(() => true),
      execute: vi.fn().mockResolvedValue(undefined),
    },
  ],
}));

vi.mock("@/bot/handlers/interactionCreate/ui/selectMenus", () => ({
  userSelectHandlers: [
    {
      matches: vi.fn((id: string) => id === "target"),
      execute: vi.fn().mockResolvedValue(undefined),
    },
  ],
  stringSelectHandlers: [
    {
      matches: vi.fn((id: string) => id === "target"),
      execute: vi.fn().mockResolvedValue(undefined),
    },
  ],
}));

describe("bot/handlers/interactionCreate/flow/components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes first matching button handler only", async () => {
    const interaction = { customId: "target" };
    const uiModule = (await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/buttons",
    )) as { buttonHandlers: Array<{ execute: Mock }> };

    await handleButton(interaction as never);

    expect(uiModule.buttonHandlers[0].execute).toHaveBeenCalledWith(
      interaction,
    );
    expect(uiModule.buttonHandlers[1].execute).not.toHaveBeenCalled();
  });

  it("delegates button handler error to interaction error handler", async () => {
    const error = new Error("button failed");
    const uiModule = (await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/buttons",
    )) as { buttonHandlers: Array<{ execute: Mock }> };
    uiModule.buttonHandlers[0].execute.mockRejectedValueOnce(error);
    const interaction = { customId: "target" };

    await handleButton(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(interaction, error);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });

  it("executes matching user-select handler", async () => {
    const interaction = { customId: "target" };
    const uiModule = (await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/selectMenus",
    )) as { userSelectHandlers: Array<{ execute: Mock }> };

    await handleUserSelectMenu(interaction as never);

    expect(uiModule.userSelectHandlers[0].execute).toHaveBeenCalledWith(
      interaction,
    );
  });

  it("executes matching string-select handler", async () => {
    const interaction = { customId: "target" };
    const uiModule = (await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/selectMenus",
    )) as { stringSelectHandlers: Array<{ execute: Mock }> };

    await handleStringSelectMenu(interaction as never);

    expect(uiModule.stringSelectHandlers[0].execute).toHaveBeenCalledWith(
      interaction,
    );
  });
});
