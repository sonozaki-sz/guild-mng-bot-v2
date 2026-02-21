// src/bot/handlers/interactionCreate/ui/buttons.ts
// ボタンハンドラのレジストリ

import { bumpPanelButtonHandler } from "../../../features/bump-reminder/handlers/ui/bumpPanelButtonHandler";
import { vacPanelButtonHandler } from "../../../features/vac/handlers/ui/vacPanelButton";
import type { ButtonHandler } from "./types";

export const buttonHandlers: ButtonHandler[] = [
  // customId プレフィックスで bump パネル操作を処理
  bumpPanelButtonHandler,
  // VAC 操作パネルのボタン入力を処理
  vacPanelButtonHandler,
];
