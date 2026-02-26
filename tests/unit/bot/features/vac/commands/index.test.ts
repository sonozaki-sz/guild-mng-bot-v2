// tests/unit/bot/features/vac/commands/index.test.ts
describe("bot/features/vac/commands modules", () => {
  it("exposes vac command modules", async () => {
    const vacConstants =
      await import("@/bot/features/vac/commands/vacCommand.constants");
    const vacExecute =
      await import("@/bot/features/vac/commands/vacCommand.execute");
    const vacConfigAutocomplete =
      await import("@/bot/features/vac/commands/vacConfigCommand.autocomplete");
    const vacConfigConstants =
      await import("@/bot/features/vac/commands/vacConfigCommand.constants");
    const vacConfigExecute =
      await import("@/bot/features/vac/commands/vacConfigCommand.execute");

    expect(vacConstants.VAC_COMMAND).toBeDefined();
    expect(vacExecute.executeVacCommand).toBeDefined();
    expect(vacConfigAutocomplete.autocompleteVacConfigCommand).toBeDefined();
    expect(vacConfigConstants.VAC_CONFIG_COMMAND).toBeDefined();
    expect(vacConfigExecute.executeVacConfigCommand).toBeDefined();
  });
});
