// tests/unit/bot/commands/index.test.ts
import { afkCommand } from "@/bot/commands/afk";
import { afkConfigCommand } from "@/bot/commands/afk-config";
import { bumpReminderConfigCommand } from "@/bot/commands/bump-reminder-config";
import { commands } from "@/bot/commands/commands";
import { messageDeleteCommand } from "@/bot/commands/message-delete";
import { messageDeleteConfigCommand } from "@/bot/commands/message-delete-config";
import { pingCommand } from "@/bot/commands/ping";
import { stickyMessageCommand } from "@/bot/commands/sticky-message";
import { vacCommand } from "@/bot/commands/vac";
import { vacConfigCommand } from "@/bot/commands/vac-config";

// 各コマンドモジュールを軽量スタブ化して index の配列構成のみを検証する
vi.mock("@/bot/commands/afk", () => ({
  afkCommand: { data: { name: "afk" } },
}));
vi.mock("@/bot/commands/afk-config", () => ({
  afkConfigCommand: { data: { name: "afk-config" } },
}));
vi.mock("@/bot/commands/bump-reminder-config", () => ({
  bumpReminderConfigCommand: { data: { name: "bump-reminder-config" } },
}));
vi.mock("@/bot/commands/message-delete", () => ({
  messageDeleteCommand: { data: { name: "message-delete" } },
}));
vi.mock("@/bot/commands/message-delete-config", () => ({
  messageDeleteConfigCommand: { data: { name: "message-delete-config" } },
}));
vi.mock("@/bot/commands/sticky-message", () => ({
  stickyMessageCommand: { data: { name: "sticky-message" } },
}));
vi.mock("@/bot/commands/vac", () => ({
  vacCommand: { data: { name: "vac" } },
}));
vi.mock("@/bot/commands/vac-config", () => ({
  vacConfigCommand: { data: { name: "vac-config" } },
}));
vi.mock("@/bot/commands/ping", () => ({
  pingCommand: { data: { name: "ping" } },
}));

describe("bot/commands index", () => {
  // index.ts が想定順で全コマンドを公開していることを確認する
  it("exports all commands in expected order", () => {
    expect(commands).toEqual([
      afkCommand,
      afkConfigCommand,
      bumpReminderConfigCommand,
      messageDeleteCommand,
      messageDeleteConfigCommand,
      stickyMessageCommand,
      vacCommand,
      vacConfigCommand,
      pingCommand,
    ]);
  });
});
