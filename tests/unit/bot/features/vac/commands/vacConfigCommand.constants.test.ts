import { VAC_CONFIG_COMMAND } from "@/bot/features/vac/commands/vacConfigCommand.constants";

describe("bot/features/vac/commands/vacConfigCommand.constants", () => {
  // vac-config の公開定数がコマンド契約どおりであることを検証
  it("exposes expected command names and options", () => {
    expect(VAC_CONFIG_COMMAND.NAME).toBe("vac-config");
    expect(VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER).toBe(
      "create-trigger-vc",
    );
    expect(VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER).toBe(
      "remove-trigger-vc",
    );
    expect(VAC_CONFIG_COMMAND.SUBCOMMAND.VIEW).toBe("view");
    expect(VAC_CONFIG_COMMAND.OPTION.CATEGORY).toBe("category");
    expect(VAC_CONFIG_COMMAND.TARGET.TOP).toBe("TOP");
  });

  it("defines trigger channel defaults and category limit", () => {
    expect(VAC_CONFIG_COMMAND.TRIGGER_CHANNEL_NAME).toBe("CreateVC");
    expect(VAC_CONFIG_COMMAND.CATEGORY_CHANNEL_LIMIT).toBe(50);
    expect(VAC_CONFIG_COMMAND.CATEGORY_CHANNEL_LIMIT).toBeGreaterThan(0);
  });
});
