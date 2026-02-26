// tests/unit/bot/features/vac/commands/vacConfigCommand.execute.test.ts
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import { handleVacConfigCreateTrigger } from "@/bot/features/vac/commands/usecases/vacConfigCreateTrigger";
import { handleVacConfigRemoveTrigger } from "@/bot/features/vac/commands/usecases/vacConfigRemoveTrigger";
import { handleVacConfigView } from "@/bot/features/vac/commands/usecases/vacConfigView";
import { VAC_CONFIG_COMMAND } from "@/bot/features/vac/commands/vacConfigCommand.constants";
import { executeVacConfigCommand } from "@/bot/features/vac/commands/vacConfigCommand.execute";

vi.mock("@/bot/features/vac/commands/usecases/vacConfigCreateTrigger", () => ({
  handleVacConfigCreateTrigger: vi.fn(),
}));

vi.mock("@/bot/features/vac/commands/usecases/vacConfigRemoveTrigger", () => ({
  handleVacConfigRemoveTrigger: vi.fn(),
}));

vi.mock("@/bot/features/vac/commands/usecases/vacConfigView", () => ({
  handleVacConfigView: vi.fn(),
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
}));

function createInteraction(overrides?: {
  guildId?: string | null;
  hasManageGuild?: boolean;
  subcommand?: string;
}) {
  return {
    guildId:
      overrides && "guildId" in overrides ? overrides.guildId : "guild-1",
    memberPermissions: {
      has: vi.fn(() =>
        overrides && "hasManageGuild" in overrides
          ? overrides.hasManageGuild
          : true,
      ),
    },
    options: {
      getSubcommand: vi.fn(
        () => overrides?.subcommand ?? VAC_CONFIG_COMMAND.SUBCOMMAND.VIEW,
      ),
    },
  };
}

// vacConfig コマンドの実行エントリポイントが、ギルド制限・権限チェック・サブコマンド分岐を
// 正しく各ユースケースハンドラへ委譲することを検証するグループ
describe("bot/features/vac/commands/vacConfigCommand.execute", () => {
  // サブコマンドごとに呼び出されるべきハンドラが異なるため、呼び出し履歴をテスト間でリセットする
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // DM 等 guildId が null の環境ではギルド専用コマンドとして拒否し、エラーハンドラに委譲することを確認
  it("delegates guild-only validation error to handleCommandError", async () => {
    const interaction = createInteraction({ guildId: null });

    await executeVacConfigCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(handleVacConfigView).not.toHaveBeenCalled();
  });

  // ManageGuild 権限を持たないユーザーのコマンド実行が拒否されることを確認
  it("delegates permission validation error to handleCommandError", async () => {
    const interaction = createInteraction({ hasManageGuild: false });

    await executeVacConfigCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(handleVacConfigCreateTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigRemoveTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigView).not.toHaveBeenCalled();
  });

  it("delegates create-trigger-vc subcommand to usecase", async () => {
    const interaction = createInteraction({
      subcommand: VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER,
    });

    await executeVacConfigCommand(interaction as never);

    expect(handleVacConfigCreateTrigger).toHaveBeenCalledWith(
      interaction,
      "guild-1",
    );
    expect(handleVacConfigRemoveTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigView).not.toHaveBeenCalled();
  });

  it("delegates remove-trigger-vc subcommand to usecase", async () => {
    const interaction = createInteraction({
      subcommand: VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER,
    });

    await executeVacConfigCommand(interaction as never);

    expect(handleVacConfigRemoveTrigger).toHaveBeenCalledWith(
      interaction,
      "guild-1",
    );
    expect(handleVacConfigCreateTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigView).not.toHaveBeenCalled();
  });

  it("delegates view subcommand to usecase", async () => {
    const interaction = createInteraction({
      subcommand: VAC_CONFIG_COMMAND.SUBCOMMAND.VIEW,
    });

    await executeVacConfigCommand(interaction as never);

    expect(handleVacConfigView).toHaveBeenCalledWith(interaction, "guild-1");
    expect(handleVacConfigCreateTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigRemoveTrigger).not.toHaveBeenCalled();
  });

  // 網羅していないサブコマンド名を渡した場合に unhandled として handleCommandError に委譲されることを確認
  it("delegates invalid subcommand error to handleCommandError", async () => {
    const interaction = createInteraction({ subcommand: "invalid-subcommand" });

    await executeVacConfigCommand(interaction as never);

    expect(handleCommandError).toHaveBeenCalledTimes(1);
    expect(handleVacConfigCreateTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigRemoveTrigger).not.toHaveBeenCalled();
    expect(handleVacConfigView).not.toHaveBeenCalled();
  });
});
