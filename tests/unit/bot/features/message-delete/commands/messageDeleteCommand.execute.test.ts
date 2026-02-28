// tests/unit/bot/features/message-delete/commands/messageDeleteCommand.execute.test.ts

import {
  MSG_DEL_CUSTOM_ID,
  type DeletedMessageRecord,
} from "@/bot/features/message-delete/constants/messageDeleteConstants";
import { ChannelType, MessageFlags, PermissionFlagsBits } from "discord.js";

// ---- モック定義 ----
const tDefaultMock = vi.fn((key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key,
);
const loggerMock = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
const handleCommandErrorMock = vi.fn();
const getUserSettingMock = vi.fn();
const updateUserSettingMock = vi.fn();
const getBotMessageDeleteUserSettingServiceMock = vi.fn(() => ({
  getUserSetting: getUserSettingMock,
  updateUserSetting: updateUserSettingMock,
}));
const createErrorEmbedMock = vi.fn((msg: string) => ({
  type: "error",
  message: msg,
}));
const createInfoEmbedMock = vi.fn((msg: string) => ({
  type: "info",
  message: msg,
}));
const createWarningEmbedMock = vi.fn((msg: string) => ({
  type: "warning",
  message: msg,
}));
const deleteMessagesMock = vi.fn();
const parseDateStrMock = vi.fn();
const buildSummaryEmbedMock = vi.fn(() => ({
  addFields: vi.fn().mockReturnThis(),
}));
const buildFilteredRecordsMock = vi.fn(
  (records: DeletedMessageRecord[]) => records,
);
const buildDetailEmbedMock = vi.fn(() => ({ type: "detail" }));
const buildPaginationComponentsMock = vi.fn(() => []);

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: tDefaultMock,
}));
vi.mock("@/shared/utils/logger", () => ({
  logger: loggerMock,
}));
vi.mock("@/bot/errors/interactionErrorHandler", () => ({
  handleCommandError: handleCommandErrorMock,
}));
vi.mock("@/bot/services/botMessageDeleteDependencyResolver", () => ({
  getBotMessageDeleteUserSettingService:
    getBotMessageDeleteUserSettingServiceMock,
}));
vi.mock("@/bot/utils/messageResponse", () => ({
  createErrorEmbed: createErrorEmbedMock,
  createInfoEmbed: createInfoEmbedMock,
  createWarningEmbed: createWarningEmbedMock,
}));
vi.mock("@/bot/features/message-delete/services/messageDeleteService", () => ({
  deleteMessages: deleteMessagesMock,
  parseDateStr: parseDateStrMock,
}));
vi.mock(
  "@/bot/features/message-delete/commands/messageDeleteEmbedBuilder",
  () => ({
    buildSummaryEmbed: buildSummaryEmbedMock,
    buildFilteredRecords: buildFilteredRecordsMock,
    buildDetailEmbed: buildDetailEmbedMock,
    buildPaginationComponents: buildPaginationComponentsMock,
  }),
);

// ---- ヘルパー ----

/** コレクタモック。テスト側から collect/end イベントを手動発火できる */
function makeCollector() {
  const handlers: Record<
    string,
    ((...args: unknown[]) => unknown) | undefined
  > = {};
  return {
    on: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      handlers[event] = handler;
    }),
    stop: vi.fn().mockImplementation(async (reason?: string) => {
      await handlers.end?.(new Map(), reason ?? "idle");
    }),
    triggerCollect: async (i: unknown) => {
      await (handlers.collect as (i: unknown) => Promise<void>)?.(i);
    },
    triggerEnd: async (reason?: string) => {
      await handlers.end?.(new Map(), reason ?? "time");
    },
  };
}

/** コレクタ付きレスポンスモック */
function makeResponse(collector: ReturnType<typeof makeCollector>) {
  return {
    createMessageComponentCollector: vi.fn(() => collector),
  };
}

/** コレクションモック（filter + map が使える） */
function makeCollection<T>(items: T[]) {
  const obj = {
    size: items.length,
    filter: vi.fn().mockImplementation((fn: (item: T) => boolean) => {
      const filtered = items.filter((item) => fn(item));
      return makeCollection(filtered);
    }),
    map: vi
      .fn()
      .mockImplementation((fn: (item: T) => unknown) => items.map(fn)),
  };
  return obj;
}

/** ギルドチャンネルモック */
function makeChannel(
  opts: {
    id?: string;
    type?: ChannelType;
    permissioned?: boolean;
  } = {},
) {
  const {
    id = "ch-text-1",
    type = ChannelType.GuildText,
    permissioned = true,
  } = opts;
  return {
    id,
    type,
    isTextBased: vi.fn(() => true),
    permissionsFor: vi.fn(() => ({
      has: vi.fn(() => permissioned),
    })),
  };
}

/** ギルドモック */
function makeGuild(
  opts: {
    channels?: ReturnType<typeof makeChannel>[];
    me?: object | null;
  } = {},
) {
  const channels = opts.channels ?? [makeChannel()];
  const me = "me" in opts ? opts.me : { id: "bot-1" };
  return {
    channels: {
      fetch: vi.fn().mockResolvedValue(makeCollection(channels)),
    },
    members: {
      me,
    },
  };
}

/** ボタンインタラクションモック (コレクタ内 i) */
function makeButtonI(
  opts: {
    userId?: string;
    customId?: string;
    isStringSelectMenu?: boolean;
    values?: string[];
    awaitModalSubmitResult?: object | null;
  } = {},
) {
  const {
    userId = "user-1",
    customId = MSG_DEL_CUSTOM_ID.PREV,
    isStringSelectMenu = false,
    values = [],
    awaitModalSubmitResult = null,
  } = opts;
  return {
    user: { id: userId },
    customId,
    reply: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    isStringSelectMenu: vi.fn(() => isStringSelectMenu),
    values,
    showModal: vi.fn().mockResolvedValue(undefined),
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    awaitModalSubmit: vi.fn().mockImplementation(async () => {
      if (awaitModalSubmitResult === null) throw new Error("timed out");
      return awaitModalSubmitResult;
    }),
    fields: {
      getTextInputValue: vi.fn(() => ""),
    },
  };
}

/** メインインタラクションモック */
function createInteraction(
  opts: {
    guildId?: string | null;
    countOption?: number | null;
    userInput?: string | null;
    botOption?: boolean | null;
    keyword?: string | null;
    daysOption?: number | null;
    afterStr?: string | null;
    beforeStr?: string | null;
    channelOption?: { type: ChannelType; id: string } | null;
    hasManageMessages?: boolean;
    hasAdministrator?: boolean;
    guild?: ReturnType<typeof makeGuild> | null;
    userId?: string;
    editReplyImpl?: (() => Promise<unknown>) | null;
  } = {},
) {
  const {
    guildId = "guild-1",
    countOption = 100,
    userInput = null,
    botOption = null,
    keyword = null,
    daysOption = null,
    afterStr = null,
    beforeStr = null,
    channelOption = {
      type: ChannelType.GuildText,
      id: "ch-option-1",
    },
    hasManageMessages = true,
    hasAdministrator = false,
    guild = makeGuild(),
    userId = "user-1",
    editReplyImpl = null,
  } = opts;

  const deferReplyMock = vi.fn().mockResolvedValue(undefined);
  const editReplyMock = editReplyImpl
    ? vi.fn().mockImplementation(editReplyImpl)
    : vi.fn().mockResolvedValue(undefined);
  const followUpMock = vi.fn().mockResolvedValue(undefined);

  return {
    guildId,
    guild,
    user: { id: userId, tag: "user#1234" },
    memberPermissions: {
      has: vi.fn((flag: bigint) => {
        if (flag === PermissionFlagsBits.ManageMessages)
          return hasManageMessages;
        if (flag === PermissionFlagsBits.Administrator) return hasAdministrator;
        return false;
      }),
    },
    deferReply: deferReplyMock,
    editReply: editReplyMock,
    followUp: followUpMock,
    options: {
      getInteger: vi.fn().mockImplementation((name: string) => {
        if (name === "count") return countOption;
        if (name === "days") return daysOption;
        return null;
      }),
      getString: vi.fn().mockImplementation((name: string) => {
        if (name === "user") return userInput;
        if (name === "keyword") return keyword;
        if (name === "after") return afterStr;
        if (name === "before") return beforeStr;
        return null;
      }),
      getBoolean: vi.fn().mockImplementation((name: string) => {
        if (name === "bot") return botOption;
        return null;
      }),
      getChannel: vi.fn().mockImplementation((name: string) => {
        if (name === "channel") return channelOption ?? null;
        return null;
      }),
    },
  };
}

/** 複数件削除結果のサンプル */
function makeManyRecords(n = 3): DeletedMessageRecord[] {
  return Array.from({ length: n }, (_, i) => ({
    authorId: `author-${i}`,
    authorTag: `user${i}#0000`,
    channelId: "ch-1",
    channelName: "general",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    content: `msg ${i}`,
  }));
}

// ====================================================================
describe("bot/features/message-delete/commands/messageDeleteCommand.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleCommandErrorMock.mockResolvedValue(undefined);
    getUserSettingMock.mockResolvedValue({ skipConfirm: true });
    updateUserSettingMock.mockResolvedValue(undefined);
    deleteMessagesMock.mockResolvedValue({
      totalDeleted: 0,
      channelBreakdown: {},
      deletedRecords: [],
    });
    parseDateStrMock.mockImplementation(() => new Date("2025-01-01T00:00:00Z"));
  });

  // ---- 早期リターン: バリデーション ----

  it("guildId がない場合は guild_only メッセージを返して終了する", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({ guildId: null });

    await executeMessageDeleteCommand(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith(
      "errors:validation.guild_only",
    );
  });

  // ユーザー入力が不正形式（mentions/ID 以外）の場合に user_invalid_format 警告が返ることを検証
  it("ユーザー入力が不正形式の場合は user_invalid_format 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({ userInput: "invalid-user-format" });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.user_invalid_format",
    );
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) }),
    );
  });

  // メンション形式のユーザー入力が正常に解析されバリデーションエラーにならないことを検証
  it("メンション形式のユーザー入力は正常に解析する", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      userInput: "<@123456789012345678>",
    });

    await executeMessageDeleteCommand(interaction as never);

    // 解析が通るのでバリデーションエラーにならない
    expect(createWarningEmbedMock).not.toHaveBeenCalledWith(
      "commands:message-delete.errors.user_invalid_format",
    );
  });

  // 生 ID 形式のユーザー入力が正常に解析されバリデーションエラーにならないことを検証
  it("生ID形式のユーザー入力は正常に解析する", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      userInput: "123456789012345678",
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).not.toHaveBeenCalledWith(
      "commands:message-delete.errors.user_invalid_format",
    );
  });

  // フィルタ条件が何もない組み合わせで no_filter 警告が返ることを検証
  it("フィルタ条件が何もない場合は no_filter 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      countOption: null,
      userInput: null,
      botOption: null,
      keyword: null,
      daysOption: null,
      afterStr: null,
      beforeStr: null,
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.no_filter",
    );
  });

  // days と after が同時指定された場合に days_and_date_conflict 警告が返ることを検証
  it("days と after が同時に指定された場合は days_and_date_conflict 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      daysOption: 7,
      afterStr: "2025-01-01",
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.days_and_date_conflict",
    );
  });

  // days と before が同時指定された場合に days_and_date_conflict 警告が返ることを検証
  it("days と before が同時に指定された場合は days_and_date_conflict 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      daysOption: 7,
      beforeStr: "2025-01-31",
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.days_and_date_conflict",
    );
  });

  // channelOption と count が両方未指定の場合に no_channel_no_count 警告が返ることを検証
  it("チャンネル未指定かつ count 未指定の場合は no_channel_no_count 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      channelOption: null,
      countOption: null,
      keyword: "test",
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.no_channel_no_count",
    );
  });

  // after の日付形式が不正な場合に after_invalid_format 警告が返ることを検証
  it("after の日付形式が不正の場合は after_invalid_format 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    parseDateStrMock.mockReturnValueOnce(null);
    const interaction = createInteraction({ afterStr: "invalid-date" });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.after_invalid_format",
    );
  });

  // before の日付形式が不正な場合に before_invalid_format 警告が返ることを検証
  it("before の日付形式が不正の場合は before_invalid_format 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    parseDateStrMock.mockReturnValueOnce(new Date("2025-01-01"));
    parseDateStrMock.mockReturnValueOnce(null);
    const interaction = createInteraction({
      afterStr: "2025-01-01",
      beforeStr: "invalid-date",
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.before_invalid_format",
    );
  });

  // after > before の場合に date_range_invalid 警告が返ることを検証
  it("after > before の場合は date_range_invalid 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    parseDateStrMock
      .mockReturnValueOnce(new Date("2025-02-01"))
      .mockReturnValueOnce(new Date("2025-01-01"));
    const interaction = createInteraction({
      afterStr: "2025-02-01",
      beforeStr: "2025-01-01",
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.date_range_invalid",
    );
  });

  // ManageMessages 権限も Administrator 権限もない場合に no_permission エラーが返ることを検証
  it("ManageMessages 権限がない場合は no_permission エラーを返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      hasManageMessages: false,
      hasAdministrator: false,
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createErrorEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.no_permission",
    );
  });

  // Administrator 権限がある場合は no_permission エラーを出さずに権限チェックを通過することを検証
  it("Administrator 権限がある場合は権限チェックを通過する", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      hasManageMessages: false,
      hasAdministrator: true,
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createErrorEmbedMock).not.toHaveBeenCalledWith(
      "commands:message-delete.errors.no_permission",
    );
  });

  // guild が null の場合は guild_only メッセージを返して終了することを検証
  it("guild が null の場合は guild_only メッセージを返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({ guild: null });

    await executeMessageDeleteCommand(interaction as never);

    expect(interaction.editReply).toHaveBeenCalledWith(
      "errors:validation.guild_only",
    );
  });

  // テキスト以外のチャンネル（GuildCategory など）が指定された場合に text_channel_only 警告が返ることを検証
  it("テキスト以外のチャンネルが指定された場合は text_channel_only 警告を返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      channelOption: { type: ChannelType.GuildCategory, id: "ch-cat" },
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(createWarningEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.text_channel_only",
    );
  });

  // ---- チャンネルタイプ：テキスト系はすべて通過する ----

  it.each([
    ["GuildText", ChannelType.GuildText],
    ["GuildAnnouncement", ChannelType.GuildAnnouncement],
    ["PublicThread", ChannelType.PublicThread],
    ["PrivateThread", ChannelType.PrivateThread],
    ["GuildVoice", ChannelType.GuildVoice],
  ])(
    "ChannelType.%s のチャンネルは text_channel_only 警告を出さない",
    async (_label, type) => {
      const { executeMessageDeleteCommand } =
        await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
      const interaction = createInteraction({
        channelOption: { type: type as ChannelType, id: "ch-1" },
      });

      await executeMessageDeleteCommand(interaction as never);

      expect(createWarningEmbedMock).not.toHaveBeenCalledWith(
        "commands:message-delete.errors.text_channel_only",
      );
    },
  );

  // ---- 全チャンネルスキャン（channelOption=null + count 指定）----

  it("channelOption なし + count 指定の場合はギルド内全チャンネルを取得する", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const guild = makeGuild();
    const interaction = createInteraction({ channelOption: null, guild });

    await executeMessageDeleteCommand(interaction as never);

    expect(guild.channels.fetch).toHaveBeenCalled();
  });

  // days オプション指定時に afterTs が現在時刻から計算されて deleteMessages に渡されることを検証
  it("days オプションが指定された場合 after タイムスタンプが計算される", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const interaction = createInteraction({
      daysOption: 7,
      afterStr: null,
      beforeStr: null,
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(deleteMessagesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        afterTs: expect.any(Number),
        beforeTs: Infinity,
      }),
    );
  });

  // ---- 削除結果: 0件 ----

  it("削除対象が0件の場合は no_messages_found 情報メッセージを返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    deleteMessagesMock.mockResolvedValue({
      totalDeleted: 0,
      channelBreakdown: {},
      deletedRecords: [],
    });
    const interaction = createInteraction();

    await executeMessageDeleteCommand(interaction as never);

    expect(createInfoEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.no_messages_found",
    );
  });

  // ---- 削除結果: 1件 ----

  it("削除結果が1件の場合はボタンなしで summaryEmbed にフィールドを追加して返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const record: DeletedMessageRecord = {
      authorId: "a1",
      authorTag: "Alice#0001",
      channelId: "ch-1",
      channelName: "general",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      content: "hello",
    };
    deleteMessagesMock.mockResolvedValue({
      totalDeleted: 1,
      channelBreakdown: { "ch-1": 1 },
      deletedRecords: [record],
    });
    const summaryEmbedMock = { addFields: vi.fn().mockReturnThis() };
    buildSummaryEmbedMock.mockReturnValue(summaryEmbedMock);
    const interaction = createInteraction();

    await executeMessageDeleteCommand(interaction as never);

    expect(summaryEmbedMock.addFields).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ components: [] }),
    );
  });

  // 削除済みメッセージのコンテンツが空文字の場合に empty_content キーが使用されることを検証
  it("削除結果が1件でコンテンツが空の場合は empty_content キーを使用する", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const record: DeletedMessageRecord = {
      authorId: "a1",
      authorTag: "Alice#0001",
      channelId: "ch-1",
      channelName: "general",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      content: "",
    };
    deleteMessagesMock.mockResolvedValue({
      totalDeleted: 1,
      channelBreakdown: { "ch-1": 1 },
      deletedRecords: [record],
    });
    const summaryEmbedMock = { addFields: vi.fn().mockReturnThis() };
    buildSummaryEmbedMock.mockReturnValue(summaryEmbedMock);
    const interaction = createInteraction();

    await executeMessageDeleteCommand(interaction as never);

    expect(tDefaultMock).toHaveBeenCalledWith(
      "commands:message-delete.result.empty_content",
    );
  });

  // ---- 削除エラー ----

  it("deleteMessages が例外を投げた場合は delete_failed エラーを返す", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    deleteMessagesMock.mockRejectedValue(new Error("bulk delete failed"));
    const interaction = createInteraction();

    await executeMessageDeleteCommand(interaction as never);

    expect(createErrorEmbedMock).toHaveBeenCalledWith(
      "commands:message-delete.errors.delete_failed",
    );
  });

  // ---- 外側 catch ----

  it("予期しない例外が発生した場合は handleCommandError を呼ぶ", async () => {
    const { executeMessageDeleteCommand } =
      await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
    const error = new Error("unexpected");
    // deferReply が throw する → 外側 catch に流れる
    const interaction = createInteraction();
    (interaction.deferReply as ReturnType<typeof vi.fn>).mockRejectedValue(
      error,
    );

    await executeMessageDeleteCommand(interaction as never);

    expect(handleCommandErrorMock).toHaveBeenCalledWith(interaction, error);
  });

  // ---- ページネイション（複数レコード）----

  describe("sendPaginatedResult", () => {
    async function runWithPagination(
      extra?: Parameters<typeof createInteraction>[0],
    ) {
      const { executeMessageDeleteCommand } =
        await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
      const collector = makeCollector();
      const response = makeResponse(collector);
      const records = makeManyRecords(3);

      deleteMessagesMock.mockResolvedValue({
        totalDeleted: records.length,
        channelBreakdown: { "ch-1": records.length },
        deletedRecords: records,
      });
      buildFilteredRecordsMock.mockImplementation(
        (rec: DeletedMessageRecord[]) => rec,
      );

      const interaction = createInteraction({
        editReplyImpl: async () => response,
        ...extra,
      });

      // sendPaginatedResult はコレクタ登録後に即 return するため promise を await すると登録済みになる
      const promise = executeMessageDeleteCommand(interaction as never);
      await promise;

      return { interaction, collector, records, promise };
    }

    // ページネイション付きで結果の Embed とコレクタが正しく設定されることを検証
    it("ページネイション付きで結果を表示する", async () => {
      const { interaction } = await runWithPagination();
      expect(interaction.editReply).toHaveBeenCalled();
      expect(buildDetailEmbedMock).toHaveBeenCalled();
    });

    // 他ユーザーのボタン操作に対して not_authorized エラーが Ephemeral で応答されることを検証
    it("他ユーザーのボタン操作は not_authorized エラーで応答する", async () => {
      const { collector } = await runWithPagination();
      const diffUserI = makeButtonI({
        userId: "other-user",
        customId: MSG_DEL_CUSTOM_ID.PREV,
      });
      await collector.triggerCollect(diffUserI);
      expect(diffUserI.reply).toHaveBeenCalledWith(
        expect.objectContaining({ flags: MessageFlags.Ephemeral }),
      );
    });

    // PREV ボタン押下でページ番号が減り Embed が再構築されることを検証
    it("PREV ボタンでページが減る", async () => {
      const { collector } = await runWithPagination();
      const i = makeButtonI({ customId: MSG_DEL_CUSTOM_ID.PREV });
      await collector.triggerCollect(i);
      expect(i.update).toHaveBeenCalled();
    });

    // NEXT ボタン押下でページ番号が増え Embed が再構築されることを検証
    it("NEXT ボタンでページが増える", async () => {
      const { collector } = await runWithPagination();
      const i = makeButtonI({ customId: MSG_DEL_CUSTOM_ID.NEXT });
      await collector.triggerCollect(i);
      expect(i.update).toHaveBeenCalled();
    });

    // FILTER_AUTHOR セレクトメニューで有効な authorTag が選択されたときフィルターが設定されることを検証
    it("FILTER_AUTHOR (SelectMenu 有効値) でフィルターが設定される", async () => {
      const { collector, records } = await runWithPagination();
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AUTHOR,
        isStringSelectMenu: true,
        values: [records[0].authorTag],
      });
      await collector.triggerCollect(i);
      expect(i.update).toHaveBeenCalled();
    });

    // FILTER_AUTHOR セレクトメニューで空値が選択されたとき authorId が undefined になることを検証
    it("FILTER_AUTHOR (SelectMenu 空値) で authorId が undefined になる", async () => {
      const { collector } = await runWithPagination();
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AUTHOR,
        isStringSelectMenu: true,
        values: [],
      });
      await collector.triggerCollect(i);
      expect(i.update).toHaveBeenCalled();
    });

    // FILTER_AUTHOR のインタラクションが StringSelectMenu でない場合はフィルター更新をスキップすることを検証
    it("FILTER_AUTHOR (isStringSelectMenu=false) では何も更新しない", async () => {
      const { collector } = await runWithPagination();
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AUTHOR,
        isStringSelectMenu: false,
      });
      await collector.triggerCollect(i);
      expect(i.update).toHaveBeenCalled();
    });

    // FILTER_RESET でフィルターがすべてリセットされることを検証
    it("FILTER_RESET でフィルターがリセットされる", async () => {
      const { collector } = await runWithPagination();
      const i = makeButtonI({ customId: MSG_DEL_CUSTOM_ID.FILTER_RESET });
      await collector.triggerCollect(i);
      expect(i.update).toHaveBeenCalled();
    });

    // collector の end イベント発火時にボタンコンポーネントが削除されることを検証
    it("collector.on('end') でボタンが削除される", async () => {
      const { collector, interaction, promise } = await runWithPagination();
      await collector.triggerEnd("time");
      await promise;
      expect(interaction.editReply).toHaveBeenCalledWith({ components: [] });
    });

    // ---- モーダル：awaitModalSubmit が null の場合 ----

    it.each([
      MSG_DEL_CUSTOM_ID.FILTER_KEYWORD,
      MSG_DEL_CUSTOM_ID.FILTER_DAYS,
      MSG_DEL_CUSTOM_ID.FILTER_AFTER,
      MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
    ])(
      "モーダル(%s): awaitModalSubmit が null の場合は何もしない",
      async (customId) => {
        const { collector, interaction } = await runWithPagination();
        const i = makeButtonI({
          customId,
          awaitModalSubmitResult: null,
        });
        await collector.triggerCollect(i);
        // showModal は呼ばれるが interaction.editReply は更新されない（初回以外）
        expect(i.showModal).toHaveBeenCalled();
      },
    );

    // ---- FILTER_KEYWORD モーダル ----

    it("FILTER_KEYWORD モーダル: 値を入力するとキーワードフィルターが更新される", async () => {
      const { collector, interaction } = await runWithPagination();
      const deferUpdateMock = vi.fn().mockResolvedValue(undefined);
      const modalSubmit = {
        deferUpdate: deferUpdateMock,
        fields: { getTextInputValue: vi.fn().mockReturnValue("hello") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_KEYWORD,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(deferUpdateMock).toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // FILTER_KEYWORD モーダルで空値を入力するとキーワードフィルターが undefined になることを検証
    it("FILTER_KEYWORD モーダル: 空値をクリアするとフィルターが undefined になる", async () => {
      const { collector, interaction } = await runWithPagination();
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_KEYWORD,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // ---- FILTER_DAYS モーダル ----

    it("FILTER_DAYS モーダル: 有効な日数を入力するとフィルターが更新される", async () => {
      const { collector, interaction } = await runWithPagination();
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("7") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // FILTER_DAYS モーダルで空文字を入力すると days フィルターがクリアされることを検証
    it("FILTER_DAYS モーダル: 空値を入力するとフィルターがクリアされる", async () => {
      const { collector, interaction } = await runWithPagination();
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // FILTER_DAYS モーダルで NaN になる値を入力すると days_invalid_value 警告が出るがリビルドが実行されることを検証
    it("FILTER_DAYS モーダル: 不正値 (NaN) を入力すると days_invalid_value 警告が出るがリビルドする", async () => {
      const { collector, interaction } = await runWithPagination();
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("abc") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({ flags: MessageFlags.Ephemeral }),
      );
    });

    // FILTER_DAYS モーダルで 0 以下の値を入力すると days_invalid_value 警告が出ることを検証
    it("FILTER_DAYS モーダル: 不正値 (0 以下) を入力すると days_invalid_value 警告が出る", async () => {
      const { collector, interaction } = await runWithPagination();
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("0") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({ flags: MessageFlags.Ephemeral }),
      );
    });

    // ---- FILTER_AFTER モーダル ----

    it("FILTER_AFTER モーダル: 有効な日付を入力するとフィルターが更新される", async () => {
      const { collector, interaction } = await runWithPagination();
      parseDateStrMock.mockReturnValue(new Date("2025-01-01"));
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-01-01") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // FILTER_AFTER モーダルで不正な日付形式を入力すると after_invalid_format 警告が出ることを検証
    it("FILTER_AFTER モーダル: 不正な日付形式は after_invalid_format 警告を出す", async () => {
      const { collector, interaction } = await runWithPagination();
      parseDateStrMock.mockReturnValue(null);
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("bad-date") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({ flags: MessageFlags.Ephemeral }),
      );
    });

    // FILTER_AFTER モーダルで after > 既存 before になる日付を入力すると date_range_invalid 警告が出ることを検証
    it("FILTER_AFTER モーダル: after > 既存 before の場合は date_range_invalid 警告を出す", async () => {
      const { collector, interaction } = await runWithPagination();
      // 先に before フィルターをセット
      const beforeDate = new Date("2025-01-01");
      const afterDate = new Date("2025-02-01"); // after > before

      // FILTER_BEFORE を先に設定
      parseDateStrMock.mockReturnValueOnce(beforeDate);
      const beforeModalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-01-01") },
      };
      const beforeI = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        awaitModalSubmitResult: beforeModalSubmit,
      });
      await collector.triggerCollect(beforeI);

      // FILTER_AFTER を設定（after > before になる）
      parseDateStrMock.mockReturnValueOnce(afterDate);
      const afterModalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-02-01") },
      };
      const afterI = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        awaitModalSubmitResult: afterModalSubmit,
      });
      await collector.triggerCollect(afterI);

      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({ flags: MessageFlags.Ephemeral }),
      );
    });

    // FILTER_AFTER モーダルで空値を入力すると after フィルターがクリアされることを検証
    it("FILTER_AFTER モーダル: 空値を入力すると after フィルターがクリアされる", async () => {
      const { collector, interaction } = await runWithPagination();
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // ---- FILTER_BEFORE モーダル ----

    it("FILTER_BEFORE モーダル: 有効な日付を入力するとフィルターが更新される", async () => {
      const { collector, interaction } = await runWithPagination();
      parseDateStrMock.mockReturnValue(new Date("2025-12-31"));
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-12-31") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // FILTER_BEFORE モーダルで不正な日付形式を入力すると before_invalid_format 警告が出ることを検証
    it("FILTER_BEFORE モーダル: 不正な日付形式は before_invalid_format 警告を出す", async () => {
      const { collector, interaction } = await runWithPagination();
      parseDateStrMock.mockReturnValue(null);
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("bad-date") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({ flags: MessageFlags.Ephemeral }),
      );
    });

    // FILTER_BEFORE モーダルで既存 after > before になる日付を入力すると date_range_invalid 警告が出ることを検証
    it("FILTER_BEFORE モーダル: 既存 after > before の場合は date_range_invalid 警告を出す", async () => {
      const { collector, interaction } = await runWithPagination();
      const afterDate = new Date("2025-02-01");
      const beforeDate = new Date("2025-01-01"); // before < after

      // FILTER_AFTER を先に設定
      parseDateStrMock.mockReturnValueOnce(afterDate);
      const afterModalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-02-01") },
      };
      const afterI = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        awaitModalSubmitResult: afterModalSubmit,
      });
      await collector.triggerCollect(afterI);

      // FILTER_BEFORE を設定（before < after になる）
      parseDateStrMock.mockReturnValueOnce(beforeDate);
      const beforeModalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-01-01") },
      };
      const beforeI = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        awaitModalSubmitResult: beforeModalSubmit,
      });
      await collector.triggerCollect(beforeI);

      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({ flags: MessageFlags.Ephemeral }),
      );
    });

    // FILTER_BEFORE モーダルで空値を入力すると before フィルターがクリアされることを検証
    it("FILTER_BEFORE モーダル: 空値を入力すると before フィルターがクリアされる", async () => {
      const { collector, interaction } = await runWithPagination();
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        awaitModalSubmitResult: modalSubmit,
      });
      await collector.triggerCollect(i);
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // ---- 不明なカスタムID（最後の else-if の false ブランチ） ----

    it("不明なカスタムIDは通常の i.update を呼ぶ", async () => {
      const { collector } = await runWithPagination();
      const i = makeButtonI({ customId: "unknown_custom_id_xyz" });
      await collector.triggerCollect(i);
      expect(i.update).toHaveBeenCalled();
    });

    // ---- catch(() => {}) ハンドラーのカバレッジ ----

    it("i.update が失敗しても無視する", async () => {
      const { collector } = await runWithPagination();
      const i = makeButtonI({ customId: MSG_DEL_CUSTOM_ID.PREV });
      (i.update as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("interaction expired"),
      );
      // エラーがスローされないことを確認
      await expect(collector.triggerCollect(i)).resolves.toBeUndefined();
    });

    // collector end 時に editReply が失敗しても例外がスローされずに無視されることを検証
    it("collector end の editReply が失敗しても無視する", async () => {
      const { collector, interaction } = await runWithPagination();
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("interaction expired"),
      );
      await expect(collector.triggerEnd("time")).resolves.toBeUndefined();
    });

    // FILTER_DAYS 不正値のときフォローアップ送信が失敗しても例外がスローされないことを検証
    it("FILTER_DAYS 不正値: followUp が失敗しても無視する", async () => {
      const { collector, interaction } = await runWithPagination();
      (interaction.followUp as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("bad") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_DAYS,
        awaitModalSubmitResult: modalSubmit,
      });
      await expect(collector.triggerCollect(i)).resolves.toBeUndefined();
    });

    // FILTER_AFTER 不正形式のときフォローアップ送信が失敗しても例外がスローされないことを検証
    it("FILTER_AFTER 不正形式: followUp が失敗しても無視する", async () => {
      const { collector, interaction } = await runWithPagination();
      parseDateStrMock.mockReturnValue(null);
      (interaction.followUp as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("bad-date") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        awaitModalSubmitResult: modalSubmit,
      });
      await expect(collector.triggerCollect(i)).resolves.toBeUndefined();
    });

    // FILTER_AFTER > before 競合のときフォローアップ送信が失敗しても例外がスローされないことを検証
    it("FILTER_AFTER > before 競合: followUp が失敗しても無視する", async () => {
      const { collector, interaction } = await runWithPagination();
      // まず valid な before フィルターをセット
      parseDateStrMock.mockReturnValueOnce(new Date("2025-01-01"));
      const beforeSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-01-01") },
      };
      await collector.triggerCollect(
        makeButtonI({
          customId: MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
          awaitModalSubmitResult: beforeSubmit,
        }),
      );

      // after > before になる after フィルターを設定してエラーを発生させる
      parseDateStrMock.mockReturnValueOnce(new Date("2025-06-01"));
      (interaction.followUp as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      const afterSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-06-01") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_AFTER,
        awaitModalSubmitResult: afterSubmit,
      });
      await expect(collector.triggerCollect(i)).resolves.toBeUndefined();
    });

    // FILTER_BEFORE 不正形式のときフォローアップ送信が失敗しても例外がスローされないことを検証
    it("FILTER_BEFORE 不正形式: followUp が失敗しても無視する", async () => {
      const { collector, interaction } = await runWithPagination();
      parseDateStrMock.mockReturnValue(null);
      (interaction.followUp as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("bad-date") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        awaitModalSubmitResult: modalSubmit,
      });
      await expect(collector.triggerCollect(i)).resolves.toBeUndefined();
    });

    // FILTER_BEFORE < after 競合のときフォローアップ送信が失敗しても例外がスローされないことを検証
    it("FILTER_BEFORE < after 競合: followUp が失敗しても無視する", async () => {
      const { collector, interaction } = await runWithPagination();
      // まず valid な after フィルターをセット
      parseDateStrMock.mockReturnValueOnce(new Date("2025-06-01"));
      const afterSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-06-01") },
      };
      await collector.triggerCollect(
        makeButtonI({
          customId: MSG_DEL_CUSTOM_ID.FILTER_AFTER,
          awaitModalSubmitResult: afterSubmit,
        }),
      );

      // before < after になる before フィルターを設定してエラーを発生させる
      parseDateStrMock.mockReturnValueOnce(new Date("2025-01-01"));
      (interaction.followUp as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      const beforeSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("2025-01-01") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_BEFORE,
        awaitModalSubmitResult: beforeSubmit,
      });
      await expect(collector.triggerCollect(i)).resolves.toBeUndefined();
    });

    // モーダル値が有効なとき editReply が失敗しても例外がスローされないことを検証
    it("有効なモーダル更新: editReply が失敗しても無視する", async () => {
      const { collector, interaction } = await runWithPagination();
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      const modalSubmit = {
        deferUpdate: vi.fn().mockResolvedValue(undefined),
        fields: { getTextInputValue: vi.fn().mockReturnValue("hello") },
      };
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.FILTER_KEYWORD,
        awaitModalSubmitResult: modalSubmit,
      });
      await expect(collector.triggerCollect(i)).resolves.toBeUndefined();
    });
  });

  // ---- showConfirmDialog (skipConfirm=false) ----

  describe("showConfirmDialog", () => {
    async function runWithConfirmDialog(
      extra?: Parameters<typeof createInteraction>[0],
    ) {
      const { executeMessageDeleteCommand } =
        await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
      const confirmCollector = makeCollector();
      const paginationCollector = makeCollector();
      let editReplyCallCount = 0;

      // 1回目: confirm dialog のレスポンス、2回目以降: pagination レスポンス
      const editReplyImpl = async () => {
        editReplyCallCount++;
        if (editReplyCallCount === 1) {
          return makeResponse(confirmCollector);
        }
        return makeResponse(paginationCollector);
      };

      const records = makeManyRecords(3);
      deleteMessagesMock.mockResolvedValue({
        totalDeleted: records.length,
        channelBreakdown: { "ch-1": records.length },
        deletedRecords: records,
      });
      getUserSettingMock.mockResolvedValue({ skipConfirm: false });

      const interaction = createInteraction({
        editReplyImpl,
        ...extra,
      });

      // showConfirmDialog は new Promise で中断するため setImmediate でマイクロタスクを消化してからコレクタを使う
      const promise = executeMessageDeleteCommand(interaction as never);
      await new Promise<void>((resolve) => setImmediate(resolve));

      return {
        interaction,
        confirmCollector,
        paginationCollector,
        records,
        promise,
      };
    }

    // skipConfirm=false のときユーザーに確認ダイアログが表示されることを検証
    it("skipConfirm=false の場合は確認ダイアログを表示する", async () => {
      const { interaction } = await runWithConfirmDialog();
      expect(tDefaultMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.question",
        expect.anything(),
      );
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // skipConfirm=false かつ channelOption なしのとき channel_all ラベルが表示されることを検証
    it("skipConfirm=false かつ channelOption なし の場合 channel_all を表示する", async () => {
      const { interaction } = await runWithConfirmDialog({
        channelOption: null,
      });
      expect(tDefaultMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.channel_all",
      );
      expect(interaction.editReply).toHaveBeenCalled();
    });

    // 確認ダイアログで他ユーザーがボタン操作した場合に not_authorized で応答されることを検証
    it("他ユーザーのボタン操作は not_authorized で応答する", async () => {
      const { confirmCollector } = await runWithConfirmDialog();
      const i = makeButtonI({
        userId: "other-user",
        customId: MSG_DEL_CUSTOM_ID.CONFIRM_YES,
      });
      await confirmCollector.triggerCollect(i);
      expect(i.reply).toHaveBeenCalledWith(
        expect.objectContaining({ flags: MessageFlags.Ephemeral }),
      );
    });

    // CONFIRM_SKIP_TOGGLE ボタンで skipNext フラグがトグルされることを検証
    it("CONFIRM_SKIP_TOGGLE で skipNext がトグルされる", async () => {
      const { confirmCollector } = await runWithConfirmDialog();
      const i = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.CONFIRM_SKIP_TOGGLE,
      });
      await confirmCollector.triggerCollect(i);
      expect(i.update).toHaveBeenCalled();
    });

    // CONFIRM_YES (skipNext=false) で削除処理が実行されることを検証
    it("CONFIRM_YES (skipNext=false) で削除処理が実行される", async () => {
      const { confirmCollector, promise } = await runWithConfirmDialog();

      // YES ボタンを押す
      const yesI = makeButtonI({ customId: MSG_DEL_CUSTOM_ID.CONFIRM_YES });
      await confirmCollector.triggerCollect(yesI);
      // end イベントを CONFIRM_YES で発火
      await confirmCollector.triggerEnd(MSG_DEL_CUSTOM_ID.CONFIRM_YES);
      await promise;

      expect(deleteMessagesMock).toHaveBeenCalled();
      expect(updateUserSettingMock).not.toHaveBeenCalled();
    });

    // CONFIRM_YES (skipNext=true) で削除処理実行とともにユーザー設定が保存されることを検証
    it("CONFIRM_YES (skipNext=true) でユーザー設定が保存される", async () => {
      const { confirmCollector, promise } = await runWithConfirmDialog();

      // まず SKIP_TOGGLE で skipNext=true にする
      const toggleI = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.CONFIRM_SKIP_TOGGLE,
      });
      await confirmCollector.triggerCollect(toggleI);

      // YES ボタンを押す → end イベントで CONFIRM_YES
      await confirmCollector.triggerEnd(MSG_DEL_CUSTOM_ID.CONFIRM_YES);
      await promise;

      expect(updateUserSettingMock).toHaveBeenCalledWith("user-1", "guild-1", {
        skipConfirm: true,
      });
    });

    // CONFIRM_YES (skipNext=true) で updateUserSetting が失敗しても削除処理が続行されることを検証
    it("CONFIRM_YES (skipNext=true) で updateUserSetting が失敗しても処理が続く", async () => {
      const { confirmCollector, promise } = await runWithConfirmDialog();

      updateUserSettingMock.mockRejectedValue(new Error("db error"));

      const toggleI = makeButtonI({
        customId: MSG_DEL_CUSTOM_ID.CONFIRM_SKIP_TOGGLE,
      });
      await confirmCollector.triggerCollect(toggleI);

      await confirmCollector.triggerEnd(MSG_DEL_CUSTOM_ID.CONFIRM_YES);
      await promise;

      expect(loggerMock.warn).toHaveBeenCalled();
    });

    // CONFIRM_NO でキャンセルメッセージが表示されて処理が終了することを検証
    it("CONFIRM_NO でキャンセルメッセージを表示して終了する", async () => {
      const { confirmCollector, interaction, promise } =
        await runWithConfirmDialog();

      await confirmCollector.triggerEnd(MSG_DEL_CUSTOM_ID.CONFIRM_NO);
      await promise;

      expect(createInfoEmbedMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.cancelled",
      );
      expect(deleteMessagesMock).not.toHaveBeenCalled();
    });

    // 確認ダイアログがタイムアウトした場合に timed_out 警告が表示されることを検証
    it("タイムアウトの場合は timed_out 警告を表示して終了する", async () => {
      const { confirmCollector, interaction, promise } =
        await runWithConfirmDialog();

      await confirmCollector.triggerEnd("time");
      await promise;

      expect(createWarningEmbedMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.timed_out",
      );
      expect(deleteMessagesMock).not.toHaveBeenCalled();
    });

    // bot/keyword/days オプションが指定されたときの確認ダイアログラベル生成を検証
    it("confirm ダイアログで各条件ラベルが生成される (bot, keyword, days)", async () => {
      await runWithConfirmDialog({
        botOption: true,
        keyword: "hello",
        daysOption: 7,
        afterStr: null,
      });

      expect(tDefaultMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.condition_bot",
      );
      expect(tDefaultMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.condition_keyword",
        expect.anything(),
      );
      expect(tDefaultMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.condition_days",
        expect.anything(),
      );
    });

    // user/after/before オプションが指定されたときの確認ダイアログラベル生成を検証
    it("confirm ダイアログで各条件ラベルが生成される (user, after, before)", async () => {
      parseDateStrMock
        .mockReturnValueOnce(new Date("2025-01-01"))
        .mockReturnValueOnce(new Date("2025-12-31"));
      await runWithConfirmDialog({
        userInput: "123456789012345678",
        afterStr: "2025-01-01",
        beforeStr: "2025-12-31",
        daysOption: null,
      });

      expect(tDefaultMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.condition_user",
        expect.anything(),
      );
      expect(tDefaultMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.condition_after",
        expect.anything(),
      );
      expect(tDefaultMock).toHaveBeenCalledWith(
        "commands:message-delete.confirm.condition_before",
        expect.anything(),
      );
    });

    // countOption が null のとき condition_count ラベルが追加されないことを検証
    it("countOption が null の場合 condition_count は追加されない", async () => {
      const { confirmCollector, promise } = await runWithConfirmDialog({
        countOption: null,
        keyword: "test",
      });
      // cancel して完了させる
      await confirmCollector.triggerEnd(MSG_DEL_CUSTOM_ID.CONFIRM_NO);
      await promise;
      expect(tDefaultMock).not.toHaveBeenCalledWith(
        "commands:message-delete.confirm.condition_count",
        expect.anything(),
      );
    });

    // ---- catch(() => {}) ハンドラーのカバレッジ ----

    it("CONFIRM_NO: editReply が失敗しても無視する", async () => {
      const { confirmCollector, interaction, promise } =
        await runWithConfirmDialog();
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      await confirmCollector.triggerEnd(MSG_DEL_CUSTOM_ID.CONFIRM_NO);
      await expect(promise).resolves.toBeUndefined();
    });

    // 確認ダイアログのタイムアウト時に editReply が失敗しても例外がスローされないことを検証
    it("タイムアウト: editReply が失敗しても無視する", async () => {
      const { confirmCollector, interaction, promise } =
        await runWithConfirmDialog();
      (interaction.editReply as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("expired"),
      );
      await confirmCollector.triggerEnd("time");
      await expect(promise).resolves.toBeUndefined();
    });
  });

  // ---- countOption=null → count=Infinity ----

  it("countOption が null の場合 count は Infinity になる", async () => {
    const { executeMessageDeleteCommand } = await import(
      "@/bot/features/message-delete/commands/messageDeleteCommand.execute"
    );
    deleteMessagesMock.mockResolvedValue({
      totalDeleted: 0,
      channelBreakdown: {},
      deletedRecords: [],
    });
    const interaction = createInteraction({
      countOption: null,
      channelOption: { type: ChannelType.GuildText, id: "ch-1" },
      keyword: "test",
    });

    await executeMessageDeleteCommand(interaction as never);

    expect(deleteMessagesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ count: Infinity }),
    );
  });

  // ---- ログ記録（削除後のログメッセージ）----

  describe("削除後のログ記録", () => {
    // ページネイションを含む削除成功後にログが記録されることを検証
    it("削除成功後にログを記録する（複数件ページネイション）", async () => {
      const { executeMessageDeleteCommand } =
        await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
      const collector = makeCollector();
      const response = makeResponse(collector);
      const records = makeManyRecords(3);

      deleteMessagesMock.mockResolvedValue({
        totalDeleted: records.length,
        channelBreakdown: { "ch-1": records.length },
        deletedRecords: records,
      });

      const interaction = createInteraction({
        editReplyImpl: async () => response,
        botOption: true,
        keyword: "test",
        userInput: "123456789012345678",
        daysOption: null,
        afterStr: null,
        beforeStr: null,
      });

      const promise = executeMessageDeleteCommand(interaction as never);
      await promise;
      await collector.triggerEnd("time");

      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining("deleted"),
      );
    });

    // after/before 指定での削除成功後にログが記録されることを検証
    it("削除成功後にログを記録する（after/before 指定）", async () => {
      const { executeMessageDeleteCommand } =
        await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
      parseDateStrMock
        .mockReturnValueOnce(new Date("2025-01-01"))
        .mockReturnValueOnce(new Date("2025-12-31"));
      const collector = makeCollector();
      const response = makeResponse(collector);
      const records = makeManyRecords(3);

      deleteMessagesMock.mockResolvedValue({
        totalDeleted: records.length,
        channelBreakdown: { "ch-1": records.length },
        deletedRecords: records,
      });

      const interaction = createInteraction({
        editReplyImpl: async () => response,
        afterStr: "2025-01-01",
        beforeStr: "2025-12-31",
        daysOption: null,
      });

      const promise = executeMessageDeleteCommand(interaction as never);
      await promise;
      await collector.triggerEnd("time");

      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining("deleted"),
      );
    });

    // onProgress コールバックが削除処理中に呼ばれることを検証
    it("onProgress コールバックが呼ばれる", async () => {
      const { executeMessageDeleteCommand } =
        await import("@/bot/features/message-delete/commands/messageDeleteCommand.execute");
      const collector = makeCollector();
      const response = makeResponse(collector);
      const records = makeManyRecords(3);

      deleteMessagesMock.mockImplementation(async (_channels, opts) => {
        await opts.onProgress("進捗メッセージ");
        return {
          totalDeleted: records.length,
          channelBreakdown: { "ch-1": records.length },
          deletedRecords: records,
        };
      });

      const interaction = createInteraction({
        editReplyImpl: async () => response,
      });

      const promise = executeMessageDeleteCommand(interaction as never);
      await promise;
      await collector.triggerEnd("time");

      expect(interaction.editReply).toHaveBeenCalledWith("進捗メッセージ");
    });

    // daysOption 指定での削除成功後にログが記録されることを検証
    it("削除成功後にログを記録する（daysOption 指定）", async () => {
      const { executeMessageDeleteCommand } = await import(
        "@/bot/features/message-delete/commands/messageDeleteCommand.execute"
      );
      const collector = makeCollector();
      const response = makeResponse(collector);
      const records = makeManyRecords(3);

      deleteMessagesMock.mockResolvedValue({
        totalDeleted: records.length,
        channelBreakdown: { "ch-1": records.length },
        deletedRecords: records,
      });

      const interaction = createInteraction({
        editReplyImpl: async () => response,
        daysOption: 7,
        afterStr: null,
        beforeStr: null,
      });

      const promise = executeMessageDeleteCommand(interaction as never);
      await promise;
      await collector.triggerEnd("time");

      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining("days=7"),
      );
    });
  });
});
