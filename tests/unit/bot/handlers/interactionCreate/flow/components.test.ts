// tests/unit/bot/handlers/interactionCreate/flow/components.test.ts
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

// ボタン・セレクトメニューのインタラクションが、customId に合致した最初のハンドラだけに
// ディスパッチされることと、エラー時の委譲動作を検証するグループ
describe("bot/handlers/interactionCreate/flow/components", () => {
  // モックの呼び出し履歴が他のテストに漏れないよう、各テスト前にリセットする
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // handlers 配列の先頭マッチが実行されるべきで、後続ハンドラは呼ばれないことを確認
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

  // ハンドラ内で例外が起きた場合、呼び出し元に伝播させず handleInteractionError に委譲することを検証
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

  // customId が一致しないハンドラは execute が呼ばれないことを確認（フィルタ漏れがないか）
  it("skips non-matching string-select handler", async () => {
    const interaction = { customId: "no-match" };
    const uiModule = (await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/selectMenus",
    )) as { stringSelectHandlers: Array<{ execute: Mock }> };

    await handleStringSelectMenu(interaction as never);

    expect(uiModule.stringSelectHandlers[0].execute).not.toHaveBeenCalled();
  });

  // ストリングセレクトハンドラのエラーも同様に handleInteractionError へ委譲されることを確認
  it("delegates string-select handler error to interaction error handler", async () => {
    const error = new Error("select failed");
    const uiModule = (await vi.importMock(
      "@/bot/handlers/interactionCreate/ui/selectMenus",
    )) as { stringSelectHandlers: Array<{ execute: Mock }> };
    uiModule.stringSelectHandlers[0].execute.mockRejectedValueOnce(error);
    const interaction = { customId: "target" };

    await handleStringSelectMenu(interaction as never);

    expect(handleInteractionError).toHaveBeenCalledWith(interaction, error);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
  });
});
