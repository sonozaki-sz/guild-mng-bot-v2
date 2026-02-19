import { bumpPanelButtonHandler } from "../../../../src/bot/features/bump-reminder/ui/bumpPanelButtonHandler";
import { vacPanelButtonHandler } from "../../../../src/bot/features/vac/handlers/ui/vacPanelButton";
import { vacPanelModalHandler } from "../../../../src/bot/features/vac/handlers/ui/vacPanelModal";
import { vacPanelUserSelectHandler } from "../../../../src/bot/features/vac/handlers/ui/vacPanelUserSelect";
import { buttonHandlers } from "../../../../src/bot/handlers/interactionCreate/ui/buttons";
import { modalHandlers } from "../../../../src/bot/handlers/interactionCreate/ui/modals";
import { userSelectHandlers } from "../../../../src/bot/handlers/interactionCreate/ui/selectMenus";

// 重い依存を避けるため、各ハンドラ本体は最小スタブを注入する
jest.mock(
  "../../../../src/bot/features/bump-reminder/ui/bumpPanelButtonHandler",
  () => ({
    bumpPanelButtonHandler: {
      matches: jest.fn(() => false),
      execute: jest.fn(),
    },
  }),
);
jest.mock(
  "../../../../src/bot/features/vac/handlers/ui/vacPanelButton",
  () => ({
    vacPanelButtonHandler: {
      matches: jest.fn(() => true),
      execute: jest.fn(),
    },
  }),
);
jest.mock("../../../../src/bot/features/vac/handlers/ui/vacPanelModal", () => ({
  vacPanelModalHandler: {
    matches: jest.fn(() => true),
    execute: jest.fn(),
  },
}));
jest.mock(
  "../../../../src/bot/features/vac/handlers/ui/vacPanelUserSelect",
  () => ({
    vacPanelUserSelectHandler: {
      matches: jest.fn(() => true),
      execute: jest.fn(),
    },
  }),
);

describe("bot/handlers/interactionCreate/ui", () => {
  // ボタンレジストリに想定ハンドラが登録済みであることを検証する
  it("exports button handlers", () => {
    expect(buttonHandlers).toEqual([
      bumpPanelButtonHandler,
      vacPanelButtonHandler,
    ]);
  });

  // モーダルレジストリに VAC ハンドラが登録されることを検証する
  it("exports modal handlers", () => {
    expect(modalHandlers).toEqual([vacPanelModalHandler]);
  });

  // ユーザーセレクトレジストリに VAC ハンドラが登録されることを検証する
  it("exports user-select handlers", () => {
    expect(userSelectHandlers).toEqual([vacPanelUserSelectHandler]);
  });
});
