import { handleInteractionError } from "@/bot/errors/interactionErrorHandler";
import {
  handleButton,
  handleUserSelectMenu,
} from "@/bot/handlers/interactionCreate/flow/components";

const loggerErrorMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tDefault: jest.fn((key: string) => `default:${key}`),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

jest.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleInteractionError: jest.fn(),
}));

jest.mock("@/bot/handlers/interactionCreate/ui", () => ({
  buttonHandlers: [
    {
      matches: jest.fn((id: string) => id === "target"),
      execute: jest.fn().mockResolvedValue(undefined),
    },
    {
      matches: jest.fn(() => true),
      execute: jest.fn().mockResolvedValue(undefined),
    },
  ],
  userSelectHandlers: [
    {
      matches: jest.fn((id: string) => id === "target"),
      execute: jest.fn().mockResolvedValue(undefined),
    },
  ],
}));

describe("bot/handlers/interactionCreate/flow/components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("executes first matching button handler only", async () => {
    const interaction = { customId: "target" };
    const uiModule = jest.requireMock(
      "@/bot/handlers/interactionCreate/ui",
    ) as { buttonHandlers: Array<{ execute: jest.Mock }> };

    await handleButton(interaction as never);

    expect(uiModule.buttonHandlers[0].execute).toHaveBeenCalledWith(
      interaction,
    );
    expect(uiModule.buttonHandlers[1].execute).not.toHaveBeenCalled();
  });

  it("delegates button handler error to interaction error handler", async () => {
    const error = new Error("button failed");
    const uiModule = jest.requireMock(
      "@/bot/handlers/interactionCreate/ui",
    ) as { buttonHandlers: Array<{ execute: jest.Mock }> };
    uiModule.buttonHandlers[0].execute.mockRejectedValueOnce(error);
    const interaction = { customId: "target" };

    await handleButton(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(interaction, error);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });

  it("executes matching user-select handler", async () => {
    const interaction = { customId: "target" };
    const uiModule = jest.requireMock(
      "@/bot/handlers/interactionCreate/ui",
    ) as { userSelectHandlers: Array<{ execute: jest.Mock }> };

    await handleUserSelectMenu(interaction as never);

    expect(uiModule.userSelectHandlers[0].execute).toHaveBeenCalledWith(
      interaction,
    );
  });
});
