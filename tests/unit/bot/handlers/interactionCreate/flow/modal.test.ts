import type { Mock } from "vitest";
import { handleInteractionError } from "@/bot/errors/interactionErrorHandler";
import { handleModalSubmit } from "@/bot/handlers/interactionCreate/flow/modal";

const loggerWarnMock = vi.fn();
const loggerDebugMock = vi.fn();
const loggerErrorMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleInteractionError: vi.fn(),
}));

vi.mock("@/bot/handlers/interactionCreate/ui/modals", () => ({
  modalHandlers: [
    {
      matches: vi.fn((id: string) => id.startsWith("vac:")),
      execute: vi.fn().mockResolvedValue(undefined),
    },
  ],
}));

describe("bot/handlers/interactionCreate/flow/modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("warns and returns when no modal handler matches", async () => {
    const interaction = { customId: "unknown", user: { tag: "user#0001" } };
    const uiModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      modalHandlers: Array<{ execute: Mock }>;
    };

    await handleModalSubmit(interaction as never);

    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(uiModule.modalHandlers[0].execute).not.toHaveBeenCalled();
  });

  it("executes matching modal handler", async () => {
    const interaction = { customId: "vac:rename", user: { tag: "user#0001" } };
    const uiModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      modalHandlers: Array<{ execute: Mock }>;
    };

    await handleModalSubmit(interaction as never);

    expect(uiModule.modalHandlers[0].execute).toHaveBeenCalledWith(interaction);
    expect(loggerDebugMock).toHaveBeenCalledTimes(1);
  });

  it("delegates modal handler errors", async () => {
    const error = new Error("modal failed");
    const uiModule = await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/modals",
    ) as {
      modalHandlers: Array<{ execute: Mock }>;
    };
    uiModule.modalHandlers[0].execute.mockRejectedValueOnce(error);
    const interaction = { customId: "vac:rename", user: { tag: "user#0001" } };

    await handleModalSubmit(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(interaction, error);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });
});
