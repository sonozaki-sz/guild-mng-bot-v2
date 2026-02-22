// src/bot/handlers/interactionCreate/ui/selectMenus.ts
// セレクトメニューハンドラのレジストリ

import { stickyMessageViewSelectHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageViewSelectHandler";
import { vacPanelUserSelectHandler } from "../../../features/vac/handlers/ui/vacPanelUserSelect";
import type { StringSelectHandler, UserSelectHandler } from "./types";

export const userSelectHandlers: UserSelectHandler[] = [
  // VAC パネルのユーザー選択入力を処理
  vacPanelUserSelectHandler,
];

export const stringSelectHandlers: StringSelectHandler[] = [
  // sticky-message view コマンドのチャンネル選択を処理
  stickyMessageViewSelectHandler,
];
