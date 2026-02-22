// src/bot/handlers/interactionCreate/ui/modals.ts
// モーダルハンドラーレジストリ

import { stickyMessageSetEmbedModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageSetEmbedModalHandler";
import { stickyMessageSetModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageSetModalHandler";
import { stickyMessageUpdateEmbedModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageUpdateEmbedModalHandler";
import { stickyMessageUpdateModalHandler } from "../../../features/sticky-message/handlers/ui/stickyMessageUpdateModalHandler";
import { vacPanelModalHandler } from "../../../features/vac/handlers/ui/vacPanelModal";
import type { ModalHandler } from "./types";

export const modalHandlers: ModalHandler[] = [
  // VAC 操作パネルのモーダル送信を処理
  vacPanelModalHandler,
  // sticky-message set プレーンテキストモーダルを処理
  stickyMessageSetModalHandler,
  // sticky-message set Embed モーダルを処理
  stickyMessageSetEmbedModalHandler,
  // sticky-message update プレーンテキストモーダルを処理
  stickyMessageUpdateModalHandler,
  // sticky-message update Embed モーダルを処理
  stickyMessageUpdateEmbedModalHandler,
];
