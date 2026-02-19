import { commands } from "../../../../src/bot/commands";
import { afkCommand } from "../../../../src/bot/commands/afk";
import { afkConfigCommand } from "../../../../src/bot/commands/afk-config";
import { bumpReminderConfigCommand } from "../../../../src/bot/commands/bump-reminder-config";
import { pingCommand } from "../../../../src/bot/commands/ping";
import { vacCommand } from "../../../../src/bot/commands/vac";
import { vacConfigCommand } from "../../../../src/bot/commands/vac-config";

// 各コマンドモジュールを軽量スタブ化して index の配列構成のみを検証する
jest.mock("../../../../src/bot/commands/afk", () => ({
  afkCommand: { data: { name: "afk" } },
}));
jest.mock("../../../../src/bot/commands/afk-config", () => ({
  afkConfigCommand: { data: { name: "afk-config" } },
}));
jest.mock("../../../../src/bot/commands/bump-reminder-config", () => ({
  bumpReminderConfigCommand: { data: { name: "bump-reminder-config" } },
}));
jest.mock("../../../../src/bot/commands/vac", () => ({
  vacCommand: { data: { name: "vac" } },
}));
jest.mock("../../../../src/bot/commands/vac-config", () => ({
  vacConfigCommand: { data: { name: "vac-config" } },
}));
jest.mock("../../../../src/bot/commands/ping", () => ({
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
