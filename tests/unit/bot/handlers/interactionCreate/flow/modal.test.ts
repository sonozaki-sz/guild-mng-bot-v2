import { handleInteractionError } from "@/bot/errors/interactionErrorHandler";
import { handleModalSubmit } from "@/bot/handlers/interactionCreate/flow/modal";

const loggerWarnMock = jest.fn();
const loggerDebugMock = jest.fn();
const loggerErrorMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tDefault: jest.fn((key: string) => `default:${key}`),
}));

jest.mock("@/shared/utils", () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

jest.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleInteractionError: jest.fn(),
}));

jest.mock("@/bot/handlers/interactionCreate/ui", () => ({
  modalHandlers: [
    {
      matches: jest.fn((id: string) => id.startsWith("vac:")),
      execute: jest.fn().mockResolvedValue(undefined),
    },
  ],
}));

describe("bot/handlers/interactionCreate/flow/modal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("warns and returns when no modal handler matches", async () => {
    const interaction = { customId: "unknown", user: { tag: "user#0001" } };
    const uiModule = jest.requireMock(
      "@/bot/handlers/interactionCreate/ui",
    ) as {
      modalHandlers: Array<{ execute: jest.Mock }>;
    };

    await handleModalSubmit(interaction as never);

    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(uiModule.modalHandlers[0].execute).not.toHaveBeenCalled();
  });

  it("executes matching modal handler", async () => {
    const interaction = { customId: "vac:rename", user: { tag: "user#0001" } };
    const uiModule = jest.requireMock(
      "@/bot/handlers/interactionCreate/ui",
    ) as {
      modalHandlers: Array<{ execute: jest.Mock }>;
    };

    await handleModalSubmit(interaction as never);

    expect(uiModule.modalHandlers[0].execute).toHaveBeenCalledWith(interaction);
    expect(loggerDebugMock).toHaveBeenCalledTimes(1);
  });

  it("delegates modal handler errors", async () => {
    const error = new Error("modal failed");
    const uiModule = jest.requireMock(
      "@/bot/handlers/interactionCreate/ui",
    ) as {
      modalHandlers: Array<{ execute: jest.Mock }>;
    };
    uiModule.modalHandlers[0].execute.mockRejectedValueOnce(error);
    const interaction = { customId: "vac:rename", user: { tag: "user#0001" } };

    await handleModalSubmit(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(interaction, error);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });
});
