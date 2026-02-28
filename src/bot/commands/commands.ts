// src/bot/commands/commands.ts
// コマンド一覧をエクスポート

import type { Command } from "../types/discord";
import { afkCommand } from "./afk";
import { afkConfigCommand } from "./afk-config";
import { bumpReminderConfigCommand } from "./bump-reminder-config";
import { memberLogConfigCommand } from "./member-log-config";
import { messageDeleteCommand } from "./message-delete";
import { messageDeleteConfigCommand } from "./message-delete-config";
import { pingCommand } from "./ping";
import { stickyMessageCommand } from "./sticky-message";
import { vacCommand } from "./vac";
import { vacConfigCommand } from "./vac-config";

/**
 * Bot が登録するスラッシュコマンド一覧
 * ここへ追加したコマンドだけが Discord API に登録される
 */
export const commands: Command[] = [
  afkCommand,
  afkConfigCommand,
  bumpReminderConfigCommand,
  memberLogConfigCommand,
  messageDeleteCommand,
  messageDeleteConfigCommand,
  stickyMessageCommand,
  vacCommand,
  vacConfigCommand,
  pingCommand,
];
