import { MessageFlags } from "discord.js";
import { bumpPanelButtonHandler } from "../../../../../src/bot/features/bump-reminder/ui/bumpPanelButtonHandler";
import { getBumpReminderConfigService } from "../../../../../src/shared/features/bump-reminder";
import { tDefault } from "../../../../../src/shared/locale";
import { getGuildTranslator } from "../../../../../src/shared/locale/helpers";
import { logger } from "../../../../../src/shared/utils/logger";
import {
  createErrorEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../../../src/shared/utils/messageResponse";

const safeReplyMock = jest.fn();
const addMentionUserMock = jest.fn();
const removeMentionUserMock = jest.fn();

// Bump設定サービス依存を切り離し、ハンドラ分岐に集中する
jest.mock("../../../../../src/shared/features/bump-reminder", () => ({
  BUMP_REMINDER_MENTION_USER_ADD_RESULT: {
    ADDED: "added",
    ALREADY_EXISTS: "already_exists",
    NOT_CONFIGURED: "not_configured",
  },
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT: {
    REMOVED: "removed",
    NOT_FOUND: "not_found",
    NOT_CONFIGURED: "not_configured",
  },
  getBumpReminderConfigService: jest.fn(() => ({
    addBumpReminderMentionUser: (...args: unknown[]) =>
      addMentionUserMock(...args),
    removeBumpReminderMentionUser: (...args: unknown[]) =>
      removeMentionUserMock(...args),
  })),
}));

// 定数と翻訳を固定化してカスタムID判定と応答内容の検証を安定させる
jest.mock("../../../../../src/bot/features/bump-reminder", () => ({
  BUMP_CONSTANTS: {
    CUSTOM_ID_PREFIX: {
      MENTION_ON: "bump:on:",
      MENTION_OFF: "bump:off:",
    },
  },
}));
jest.mock("../../../../../src/shared/locale", () => ({
  tDefault: jest.fn((key: string) => key),
}));
jest.mock("../../../../../src/shared/locale/helpers", () => ({
  getGuildTranslator: jest.fn(async () => (key: string) => key),
}));

// interaction 応答は safeReply 経由のみ検証する
jest.mock("../../../../../src/shared/utils/interaction", () => ({
  safeReply: (...args: unknown[]) => safeReplyMock(...args),
}));

// ログ・Embed 生成は副作用排除のためダミーにする
jest.mock("../../../../../src/shared/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("../../../../../src/shared/utils/messageResponse", () => ({
  createErrorEmbed: jest.fn((message: string) => ({ message })),
  createSuccessEmbed: jest.fn((message: string) => ({ message })),
  createWarningEmbed: jest.fn((message: string) => ({ message })),
}));

type ButtonInteractionLike = {
  customId: string;
  guild: { id: string } | null;
  user: { id: string };
};

// bumpPanel ハンドラ検証用の最小 interaction モック
function createInteraction(
  overrides?: Partial<ButtonInteractionLike>,
): ButtonInteractionLike {
  return {
    customId: "bump:on:guild-1",
    guild: { id: "guild-1" },
    user: { id: "user-1" },
    ...overrides,
  };
}

describe("bot/features/bump-reminder/ui/bumpPanelButtonHandler", () => {
  // モック履歴をケースごとに初期化
  beforeEach(() => {
    jest.clearAllMocks();
    safeReplyMock.mockResolvedValue(undefined);
    addMentionUserMock.mockResolvedValue("added");
    removeMentionUserMock.mockResolvedValue("removed");
  });

  // customId prefix 判定が有効であることを検証
  it("matches mention on/off custom IDs", () => {
    expect(bumpPanelButtonHandler.matches("bump:on:guild-1")).toBe(true);
    expect(bumpPanelButtonHandler.matches("bump:off:guild-1")).toBe(true);
    expect(bumpPanelButtonHandler.matches("other:guild-1")).toBe(false);
  });

  // ギルド不一致時にエラー応答して終了することを検証
  it("replies error when guild does not match customId guild", async () => {
    const interaction = createInteraction({
      customId: "bump:on:guild-1",
      guild: { id: "guild-x" },
    });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      content: "events:bump-reminder.panel.error",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("replies error when guild is missing", async () => {
    const interaction = createInteraction({ guild: null });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      content: "events:bump-reminder.panel.error",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("replies not-configured error on add path", async () => {
    addMentionUserMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(addMentionUserMock).toHaveBeenCalledWith("guild-1", "user-1");
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      content: "events:bump-reminder.panel.error",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("replies warning when add target already exists", async () => {
    addMentionUserMock.mockResolvedValueOnce("already_exists");
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(createWarningEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.already_added",
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.already_added" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("replies success and logs debug on add success", async () => {
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(getBumpReminderConfigService).toHaveBeenCalledTimes(1);
    expect(getGuildTranslator).toHaveBeenCalledWith("guild-1");
    expect(createSuccessEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.mention_added",
      { title: "events:bump-reminder.panel.success_title" },
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.mention_added" }],
      flags: MessageFlags.Ephemeral,
    });
    expect(logger.debug).toHaveBeenCalled();
  });

  it("replies not-configured error on remove path", async () => {
    removeMentionUserMock.mockResolvedValueOnce("not_configured");
    const interaction = createInteraction({ customId: "bump:off:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(removeMentionUserMock).toHaveBeenCalledWith("guild-1", "user-1");
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      content: "events:bump-reminder.panel.error",
      flags: MessageFlags.Ephemeral,
    });
  });

  it("replies warning when remove target is not found", async () => {
    removeMentionUserMock.mockResolvedValueOnce("not_found");
    const interaction = createInteraction({ customId: "bump:off:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(createWarningEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.not_in_list",
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.not_in_list" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("replies success and logs debug on remove success", async () => {
    const interaction = createInteraction({ customId: "bump:off:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(createSuccessEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.mention_removed",
      { title: "events:bump-reminder.panel.success_title" },
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.mention_removed" }],
      flags: MessageFlags.Ephemeral,
    });
    expect(logger.debug).toHaveBeenCalled();
  });

  it("handles execution error and sends fallback error embed", async () => {
    addMentionUserMock.mockRejectedValueOnce(new Error("db failed"));
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to handle bump panel button",
      expect.any(Error),
    );
    expect(tDefault).toHaveBeenCalledWith("errors:general.error_title");
    expect(createErrorEmbed).toHaveBeenCalledWith(
      "events:bump-reminder.panel.error",
      { title: "errors:general.error_title" },
    );
    expect(safeReplyMock).toHaveBeenCalledWith(interaction, {
      embeds: [{ message: "events:bump-reminder.panel.error" }],
      flags: MessageFlags.Ephemeral,
    });
  });

  it("logs secondary error when fallback reply also fails", async () => {
    addMentionUserMock.mockRejectedValueOnce(new Error("db failed"));
    safeReplyMock.mockRejectedValueOnce(new Error("reply failed"));
    const interaction = createInteraction({ customId: "bump:on:guild-1" });

    await bumpPanelButtonHandler.execute(interaction as never);

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to handle bump panel button",
      expect.any(Error),
    );
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to send error reply",
      expect.any(Error),
    );
  });
});
