import { commands } from "@/bot/commands";
import { afkCommand } from "@/bot/commands/afk";
import { afkConfigCommand } from "@/bot/commands/afk-config";
import { bumpReminderConfigCommand } from "@/bot/commands/bump-reminder-config";
import { pingCommand } from "@/bot/commands/ping";
import { vacCommand } from "@/bot/commands/vac";
import { vacConfigCommand } from "@/bot/commands/vac-config";

// 各コマンドモジュールを軽量スタブ化して index の配列構成のみを検証する
jest.mock("@/bot/commands/afk", () => ({
  afkCommand: { data: { name: "afk" } },
}));
jest.mock("@/bot/commands/afk-config", () => ({
  afkConfigCommand: { data: { name: "afk-config" } },
}));
jest.mock("@/bot/commands/bump-reminder-config", () => ({
  bumpReminderConfigCommand: { data: { name: "bump-reminder-config" } },
}));
jest.mock("@/bot/commands/vac", () => ({
  vacCommand: { data: { name: "vac" } },
}));
jest.mock("@/bot/commands/vac-config", () => ({
  vacConfigCommand: { data: { name: "vac-config" } },
}));
jest.mock("@/bot/commands/ping", () => ({
  pingCommand: { data: { name: "ping" } },
}));

describe("bot/commands index", () => {
  // index.ts が想定順で全コマンドを公開していることを確認する
  it("exports all commands in expected order", () => {
    expect(commands).toEqual([
      afkCommand,
      afkConfigCommand,
      bumpReminderConfigCommand,
      vacCommand,
      vacConfigCommand,
      pingCommand,
    ]);
  });
});
