// src/bot/commands/index.ts
// コマンド一覧をエクスポート

import type { Command } from "../../shared/types/discord";
import { afkCommand } from "./afk";
import { afkConfigCommand } from "./afk-config";
import { pingCommand } from "./ping";

export const commands: Command[] = [afkCommand, afkConfigCommand, pingCommand];
