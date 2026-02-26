// tests/unit/bot/handlers/index.test.ts
import { bumpPanelButtonHandler } from "@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler";
import { stickyMessageSetEmbedModalHandler } from "@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler";
import { stickyMessageSetModalHandler } from "@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler";
import { stickyMessageUpdateEmbedModalHandler } from "@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler";
import { stickyMessageUpdateModalHandler } from "@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler";
import { vacPanelButtonHandler } from "@/bot/features/vac/handlers/ui/vacPanelButton";
import { vacPanelModalHandler } from "@/bot/features/vac/handlers/ui/vacPanelModal";
import { vacPanelUserSelectHandler } from "@/bot/features/vac/handlers/ui/vacPanelUserSelect";
import { buttonHandlers } from "@/bot/handlers/interactionCreate/ui/buttons";
import { modalHandlers } from "@/bot/handlers/interactionCreate/ui/modals";
import { stringSelectHandlers } from "@/bot/handlers/interactionCreate/ui/selectMenus";

// 重い依存を避けるため、各ハンドラ本体は最小スタブを注入する
vi.mock(
  "@/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler",
  () => ({
    bumpPanelButtonHandler: {
      matches: vi.fn(() => false),
      execute: vi.fn(),
    },
  }),
);
vi.mock("@/bot/features/vac/handlers/ui/vacPanelButton", () => ({
  vacPanelButtonHandler: {
    matches: vi.fn(() => true),
    execute: vi.fn(),
  },
}));
vi.mock("@/bot/features/vac/handlers/ui/vacPanelModal", () => ({
  vacPanelModalHandler: {
    matches: vi.fn(() => true),
    execute: vi.fn(),
  },
}));
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageSetModalHandler",
  () => ({
    stickyMessageSetModalHandler: {
      matches: vi.fn(() => true),
      execute: vi.fn(),
    },
  }),
);
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler",
  () => ({
    stickyMessageSetEmbedModalHandler: {
      matches: vi.fn(() => true),
      execute: vi.fn(),
    },
  }),
);
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler",
  () => ({
    stickyMessageUpdateModalHandler: {
      matches: vi.fn(() => true),
      execute: vi.fn(),
    },
  }),
);
vi.mock(
  "@/bot/features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler",
  () => ({
    stickyMessageUpdateEmbedModalHandler: {
      matches: vi.fn(() => true),
      execute: vi.fn(),
    },
  }),
);
vi.mock("@/bot/features/vac/handlers/ui/vacPanelUserSelect", () => ({
  vacPanelUserSelectHandler: {
    matches: vi.fn(() => true),
    execute: vi.fn(),
  },
}));

describe("bot/handlers/interactionCreate/ui", () => {
  // ボタンレジストリに想定ハンドラが登録済みであることを検証する
  it("exports button handlers", () => {
    expect(buttonHandlers).toEqual([
      bumpPanelButtonHandler,
      vacPanelButtonHandler,
    ]);
  });

  // モーダルレジストリに全ハンドラが登録されることを検証する
  it("exports modal handlers", () => {
    expect(modalHandlers).toEqual([
      vacPanelModalHandler,
      stickyMessageSetModalHandler,
      stickyMessageSetEmbedModalHandler,
      stickyMessageUpdateModalHandler,
      stickyMessageUpdateEmbedModalHandler,
    ]);
  });

  // 文字列セレクトレジストリに VAC ハンドラが登録されることを検証する
  it("exports string-select handlers", () => {
    expect(stringSelectHandlers).toContainEqual(vacPanelUserSelectHandler);
  });
});
