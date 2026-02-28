// tests/unit/bot/features/message-delete/commands/messageDeleteConfigCommand.execute.test.ts

const tDefaultMock = vi.fn((key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key,
);
const handleCommandErrorMock = vi.fn();
const updateUserSettingMock = vi.fn();
const getBotMessageDeleteUserSettingServiceMock = vi.fn(() => ({
  updateUserSetting: updateUserSettingMock,
}));

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: tDefaultMock,
}));
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: handleCommandErrorMock,
}));
vi.mock("@/bot/services/botMessageDeleteDependencyResolver", () => ({
  getBotMessageDeleteUserSettingService:
    getBotMessageDeleteUserSettingServiceMock,
}));

function createInteraction(
  opts: {
    guildId?: string | null;
    confirmEnabled?: boolean;
  } = {},
) {
  const { guildId = "guild-1", confirmEnabled = true } = opts;
  return {
    guildId,
    user: { id: "user-1" },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    options: {
      getBoolean: vi.fn().mockReturnValue(confirmEnabled),
    },
  };
}

describe("bot/features/message-delete/commands/messageDeleteConfigCommand.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleCommandErrorMock.mockResolvedValue(undefined);
    updateUserSettingMock.mockResolvedValue(undefined);
  });

  // guildId が null のインタラクションでは guild_only エラーメッセージを返して処理を終了することを検証
  it("guildId がない場合は guild_only メッセージを返して終了する", async () => {
    const { executeMessageDeleteConfigCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteConfigCommand.execute");
    const interaction = createInteraction({ guildId: null });

    await executeMessageDeleteConfigCommand(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith(
      "errors:validation.guild_only",
    );
    expect(updateUserSettingMock).not.toHaveBeenCalled();
  });

  // confirmEnabled=true のとき skipConfirm=false で設定更新し confirm_on ラベルで応答することを検証
  it("confirmEnabled=true の場合、skipConfirm=false で設定を更新し confirm_on ラベルで応答する", async () => {
    const { executeMessageDeleteConfigCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteConfigCommand.execute");
    const interaction = createInteraction({ confirmEnabled: true });

    await executeMessageDeleteConfigCommand(interaction as never);

    expect(updateUserSettingMock).toHaveBeenCalledWith("user-1", "guild-1", {
      skipConfirm: false,
    });
    expect(interaction.editReply).toHaveBeenCalledWith(
      'commands:message-delete-config.result.updated:{"status":"commands:message-delete-config.result.confirm_on"}',
    );
  });

  // confirmEnabled=false のとき skipConfirm=true で設定更新し confirm_off ラベルで応答することを検証
  it("confirmEnabled=false の場合、skipConfirm=true で設定を更新し confirm_off ラベルで応答する", async () => {
    const { executeMessageDeleteConfigCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteConfigCommand.execute");
    const interaction = createInteraction({ confirmEnabled: false });

    await executeMessageDeleteConfigCommand(interaction as never);

    expect(updateUserSettingMock).toHaveBeenCalledWith("user-1", "guild-1", {
      skipConfirm: true,
    });
    expect(interaction.editReply).toHaveBeenCalledWith(
      'commands:message-delete-config.result.updated:{"status":"commands:message-delete-config.result.confirm_off"}',
    );
  });

  // updateUserSetting が例外を投げた場合に handleCommandError が呼ばれることを検証
  it("例外が発生した場合は handleCommandError を呼ぶ", async () => {
    const { executeMessageDeleteConfigCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteConfigCommand.execute");
    const error = new Error("unexpected error");
    updateUserSettingMock.mockRejectedValue(error);
    const interaction = createInteraction();

    await executeMessageDeleteConfigCommand(interaction as never);

    expect(handleCommandErrorMock).toHaveBeenCalledWith(interaction, error);
  });
});
