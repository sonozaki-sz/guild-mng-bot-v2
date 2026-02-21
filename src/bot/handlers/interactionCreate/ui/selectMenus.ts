// src/bot/handlers/interactionCreate/ui/selectMenus.ts
// セレクトメニューハンドラのレジストリ

import { vacPanelUserSelectHandler } from "../../../features/vac/handlers/ui/vacPanelUserSelect";
import type { UserSelectHandler } from "./types";

export const userSelectHandlers: UserSelectHandler[] = [
  // VAC パネルのユーザー選択入力を処理
  vacPanelUserSelectHandler,
];
