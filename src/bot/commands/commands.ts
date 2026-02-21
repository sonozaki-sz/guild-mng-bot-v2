// src/bot/commands/commands.ts
// コマンド一覧をエクスポート

import type { Command } from "../types/discord";
import { afkCommand } from "./afk";
import { afkConfigCommand } from "./afk-config";
import { bumpReminderConfigCommand } from "./bump-reminder-config";
import { pingCommand } from "./ping";
import { vacCommand } from "./vac";
import { vacConfigCommand } from "./vac-config";

export const commands: Command[] = [
  afkCommand,
  afkConfigCommand,
  bumpReminderConfigCommand,
  vacCommand,
  vacConfigCommand,
  pingCommand,
];