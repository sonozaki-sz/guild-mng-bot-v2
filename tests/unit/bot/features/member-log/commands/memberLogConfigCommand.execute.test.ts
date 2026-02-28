// tests/unit/bot/features/member-log/commands/memberLogConfigCommand.execute.test.ts
import { handleCommandError } from "@/bot/errors/interactionErrorHandler";
import { MEMBER_LOG_CONFIG_COMMAND } from "@/bot/features/member-log/commands/memberLogConfigCommand.constants";
import { executeMemberLogConfigCommand } from "@/bot/features/member-log/commands/memberLogConfigCommand.execute";
import { ValidationError } from "@/shared/errors/customErrors";

// ---- モック定義 ----
const setChannelMock = vi.fn();
const enableMock = vi.fn();
const disableMock = vi.fn();
const setJoinMessageMock = vi.fn();
const setLeaveMessageMock = vi.fn();
const viewMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => key),
}));

vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: vi.fn(),
}));

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.setChannel",
  () => ({
    handleMemberLogConfigSetChannel: (...args: unknown[]) =>
      setChannelMock(...args),
  }),
);

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.enable",
  () => ({
    handleMemberLogConfigEnable: (...args: unknown[]) => enableMock(...args),
  }),
);

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.disable",
  () => ({
    handleMemberLogConfigDisable: (...args: unknown[]) => disableMock(...args),
  }),
);

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.setJoinMessage",
  () => ({
    handleMemberLogConfigSetJoinMessage: (...args: unknown[]) =>
      setJoinMessageMock(...args),
  }),
);

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.setLeaveMessage",
  () => ({
    handleMemberLogConfigSetLeaveMessage: (...args: unknown[]) =>
      setLeaveMessageMock(...args),
  }),
);

vi.mock(
  "@/bot/features/member-log/commands/memberLogConfigCommand.view",
  () => ({
    handleMemberLogConfigView: (...args: unknown[]) => viewMock(...args),
  }),
);

// ---- ヘルパー ----

/** テスト用 interaction モックを生成する */
function makeInteraction(
  overrides: { guildId?: string | null; subcommand?: string } = {},
) {
  return {
    guildId: overrides.guildId !== undefined ? overrides.guildId : "guild-1",
    options: {
      getSubcommand: vi.fn(
        () => overrides.subcommand ?? MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.VIEW,
      ),
    },
    reply: vi.fn().mockResolvedValue(undefined),
  };
}

// executeMemberLogConfigCommand のルーティング・バリデーション・エラー委譲を検証
describe("bot/features/member-log/commands/memberLogConfigCommand.execute", () => {
  // 各テストでモック呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Guild 外実行・不明サブコマンドの検証分岐を確認
  describe("validation", () => {
    // guildId が null の場合に ValidationError が handleCommandError へ伝わることを確認
    it("calls handleCommandError with ValidationError when guildId is null", async () => {
      const interaction = makeInteraction({ guildId: null });

      await executeMemberLogConfigCommand(interaction as never);

      expect(handleCommandError).toHaveBeenCalledWith(
        interaction,
        expect.any(ValidationError),
      );
    });

    // 未定義のサブコマンドを受け取った場合に ValidationError が handleCommandError へ伝わることを確認
    it("calls handleCommandError with ValidationError for unknown subcommand", async () => {
      const interaction = makeInteraction({ subcommand: "unknown-sub" });

      await executeMemberLogConfigCommand(interaction as never);

      expect(handleCommandError).toHaveBeenCalledWith(
        interaction,
        expect.any(ValidationError),
      );
    });
  });

  // 各サブコマンドが対応するハンドラへ委譲されることを確認
  describe("routing", () => {
    // set-channel サブコマンドが setChannel ハンドラへ委譲されることを確認
    it("delegates set-channel to handleMemberLogConfigSetChannel", async () => {
      const interaction = makeInteraction({
        subcommand: MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.SET_CHANNEL,
      });

      await executeMemberLogConfigCommand(interaction as never);

      expect(setChannelMock).toHaveBeenCalledWith(interaction, "guild-1");
    });

    // enable サブコマンドが enable ハンドラへ委譲されることを確認
    it("delegates enable to handleMemberLogConfigEnable", async () => {
      const interaction = makeInteraction({
        subcommand: MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.ENABLE,
      });

      await executeMemberLogConfigCommand(interaction as never);

      expect(enableMock).toHaveBeenCalledWith(interaction, "guild-1");
    });

    // disable サブコマンドが disable ハンドラへ委譲されることを確認
    it("delegates disable to handleMemberLogConfigDisable", async () => {
      const interaction = makeInteraction({
        subcommand: MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.DISABLE,
      });

      await executeMemberLogConfigCommand(interaction as never);

      expect(disableMock).toHaveBeenCalledWith(interaction, "guild-1");
    });

    // set-join-message サブコマンドが setJoinMessage ハンドラへ委譲されることを確認
    it("delegates set-join-message to handleMemberLogConfigSetJoinMessage", async () => {
      const interaction = makeInteraction({
        subcommand: MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.SET_JOIN_MESSAGE,
      });

      await executeMemberLogConfigCommand(interaction as never);

      expect(setJoinMessageMock).toHaveBeenCalledWith(interaction, "guild-1");
    });

    // set-leave-message サブコマンドが setLeaveMessage ハンドラへ委譲されることを確認
    it("delegates set-leave-message to handleMemberLogConfigSetLeaveMessage", async () => {
      const interaction = makeInteraction({
        subcommand: MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.SET_LEAVE_MESSAGE,
      });

      await executeMemberLogConfigCommand(interaction as never);

      expect(setLeaveMessageMock).toHaveBeenCalledWith(interaction, "guild-1");
    });

    // view サブコマンドが view ハンドラへ委譲されることを確認
    it("delegates view to handleMemberLogConfigView", async () => {
      const interaction = makeInteraction({
        subcommand: MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.VIEW,
      });

      await executeMemberLogConfigCommand(interaction as never);

      expect(viewMock).toHaveBeenCalledWith(interaction, "guild-1");
    });
  });

  // サブハンドラが例外を投げた場合も handleCommandError へ委譲されることを確認
  describe("error propagation", () => {
    // サブハンドラが例外を投げた場合に handleCommandError が呼ばれることを確認
    it("calls handleCommandError when sub-handler throws", async () => {
      const error = new Error("sub-handler error");
      enableMock.mockRejectedValue(error);
      const interaction = makeInteraction({
        subcommand: MEMBER_LOG_CONFIG_COMMAND.SUBCOMMAND.ENABLE,
      });

      await executeMemberLogConfigCommand(interaction as never);

      expect(handleCommandError).toHaveBeenCalledWith(interaction, error);
    });
  });
});
