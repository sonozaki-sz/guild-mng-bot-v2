import type { Mock } from "vitest";

const handleAutocompleteMock: Mock = vi.fn();
const handleButtonMock: Mock = vi.fn();
const handleChatInputCommandMock: Mock = vi.fn();
const handleModalSubmitMock: Mock = vi.fn();
const handleUserSelectMenuMock: Mock = vi.fn();

vi.mock("@/bot/handlers/interactionCreate/flow/command", () => ({
  handleAutocomplete: (...args: unknown[]) => handleAutocompleteMock(...args),
  handleChatInputCommand: (...args: unknown[]) =>
    handleChatInputCommandMock(...args),
}));

vi.mock("@/bot/handlers/interactionCreate/flow/modal", () => ({
  handleModalSubmit: (...args: unknown[]) => handleModalSubmitMock(...args),
}));

vi.mock("@/bot/handlers/interactionCreate/flow/components", () => ({
  handleButton: (...args: unknown[]) => handleButtonMock(...args),
  handleUserSelectMenu: (...args: unknown[]) =>
    handleUserSelectMenuMock(...args),
}));

describe("bot/handlers/interactionCreate/index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes chat input command to chat handler", async () => {
    const { handleInteractionCreate } =
      await import("@/bot/handlers/interactionCreate/handleInteractionCreate");

    const interaction = {
      client: {},
      isChatInputCommand: () => true,
      isAutocomplete: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      isUserSelectMenu: () => false,
    };

    await handleInteractionCreate(interaction as never);

    expect(handleChatInputCommandMock).toHaveBeenCalledTimes(1);
    expect(handleAutocompleteMock).not.toHaveBeenCalled();
  });

  it("routes user select menu to user select handler", async () => {
    const { handleInteractionCreate } =
      await import("@/bot/handlers/interactionCreate/handleInteractionCreate");

    const interaction = {
      client: {},
      isChatInputCommand: () => false,
      isAutocomplete: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      isUserSelectMenu: () => true,
    };

    await handleInteractionCreate(interaction as never);

    expect(handleUserSelectMenuMock).toHaveBeenCalledTimes(1);
    expect(handleButtonMock).not.toHaveBeenCalled();
  });
});
