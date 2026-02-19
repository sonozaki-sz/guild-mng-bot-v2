// src/bot/commands/index.ts
// コマンド一覧をエクスポート

import type { Command } from "../../bot/types/discord";
import { afkCommand } from "./afk";
import { afkConfigCommand } from "./afk-config";
import { bumpReminderConfigCommand } from "./bump-reminder-config";
import { pingCommand } from "./ping";
import { vacCommand } from "./vac";
import { vacConfigCommand } from "./vac-config";

export const commands: Command[] = [
  // 起動時にこの配列を順に登録
  // 管理系より先に一般操作を置くなどの依存はないため、可読性優先で機能単位に列挙
  afkCommand,
  afkConfigCommand,
  bumpReminderConfigCommand,
  vacCommand,
  vacConfigCommand,
  pingCommand,
];
