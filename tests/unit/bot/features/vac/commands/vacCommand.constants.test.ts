// tests/unit/bot/features/vac/commands/vacCommand.constants.test.ts
import { VAC_COMMAND } from "@/bot/features/vac/commands/vacCommand.constants";

describe("bot/features/vac/commands/vacCommand.constants", () => {
  // VAC コマンド定数の契約値を固定化して回帰を検知する
  it("exposes expected command names and options", () => {
    expect(VAC_COMMAND.NAME).toBe("vac");
    expect(VAC_COMMAND.SUBCOMMAND.VC_RENAME).toBe("vc-rename");
    expect(VAC_COMMAND.SUBCOMMAND.VC_LIMIT).toBe("vc-limit");
    expect(VAC_COMMAND.OPTION.NAME).toBe("name");
    expect(VAC_COMMAND.OPTION.LIMIT).toBe("limit");
  });

  it("defines valid user limit range", () => {
    expect(VAC_COMMAND.LIMIT_MIN).toBe(0);
    expect(VAC_COMMAND.LIMIT_MAX).toBe(99);
    expect(VAC_COMMAND.LIMIT_MIN).toBeLessThan(VAC_COMMAND.LIMIT_MAX);
  });
});
