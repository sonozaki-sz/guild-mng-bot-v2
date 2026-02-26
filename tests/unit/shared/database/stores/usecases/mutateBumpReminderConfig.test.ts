// tests/unit/shared/database/stores/usecases/mutateBumpReminderConfig.test.ts
import {
  casUpdateBumpReminderConfig,
  createInitialBumpReminderConfig,
  fetchBumpReminderConfigSnapshot,
  initializeBumpReminderConfigIfMissing,
} from "@/shared/database/stores/helpers/bumpReminderConfigCas";
import {
  mutateBumpReminderConfigUseCase,
  mutateBumpReminderMentionUsersUseCase,
} from "@/shared/database/stores/usecases/mutateBumpReminderConfig";
import {
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_MODE,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
} from "@/shared/database/types";
import type { MockedFunction } from "vitest";

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn(() => "db-update-failed"),
}));

vi.mock("@/shared/database/stores/helpers/bumpReminderConfigCas", () => ({
  BUMP_REMINDER_CAS_MAX_RETRIES: 3,
  fetchBumpReminderConfigSnapshot: vi.fn(),
  initializeBumpReminderConfigIfMissing: vi.fn(),
  createInitialBumpReminderConfig: vi.fn(() => ({
    enabled: true,
    mentionUserIds: [],
  })),
  casUpdateBumpReminderConfig: vi.fn(),
}));

// BumpReminderConfig の変更ユースケース (CAS ループ・初期化・メンションユーザー管理) の動作を検証
describe("shared/database/stores/usecases/mutateBumpReminderConfig", () => {
  const fetchSnapshotMock = fetchBumpReminderConfigSnapshot as MockedFunction<
    typeof fetchBumpReminderConfigSnapshot
  >;
  const initializeIfMissingMock =
    initializeBumpReminderConfigIfMissing as MockedFunction<
      typeof initializeBumpReminderConfigIfMissing
    >;
  const createInitialMock = createInitialBumpReminderConfig as MockedFunction<
    typeof createInitialBumpReminderConfig
  >;
  const casUpdateMock = casUpdateBumpReminderConfig as MockedFunction<
    typeof casUpdateBumpReminderConfig
  >;

  const context = {
    prisma: { guildConfig: {} } as never,
    defaultLocale: "ja",
    safeJsonParse: vi.fn(),
  };

  // 各ケースでモックの呼び出し記録をリセットし、テスト間の副作用を排除する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NOT_CONFIGURED when JSON exists but parse fails", async () => {
    fetchSnapshotMock.mockResolvedValue({
      recordExists: true,
      rawConfig: "broken-json",
    });
    context.safeJsonParse.mockReturnValue(undefined);

    await expect(
      mutateBumpReminderConfigUseCase(context, "guild-1", () => {
        throw new Error("should not run");
      }),
    ).resolves.toBe(BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED);
  });

  // レコード未存在時に初期化を呼び出し、2回目のスナップショット取得後に CAS 書き込みが成功するまでリトライすること
  it("initializes config if missing and retries until CAS update succeeds", async () => {
    fetchSnapshotMock
      .mockResolvedValueOnce({ recordExists: false, rawConfig: null })
      .mockResolvedValueOnce({
        recordExists: true,
        rawConfig: '{"enabled":true,"mentionUserIds":[]}',
      });
    context.safeJsonParse
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ enabled: true, mentionUserIds: [] });
    initializeIfMissingMock.mockResolvedValue(true);
    casUpdateMock.mockResolvedValue(true);

    const result = await mutateBumpReminderConfigUseCase(
      context,
      "guild-2",
      (config) => ({
        result: BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED,
        updatedConfig: { ...config, mentionRoleId: "role-1" },
      }),
    );

    expect(createInitialMock).toHaveBeenCalled();
    expect(initializeIfMissingMock).toHaveBeenCalledWith(
      context.prisma,
      "guild-2",
      "ja",
      expect.any(Object),
      false,
    );
    expect(casUpdateMock).toHaveBeenCalled();
    expect(result).toBe(BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED);
  });

  it("returns mutator result immediately when skipWrite is true", async () => {
    fetchSnapshotMock.mockResolvedValue({
      recordExists: true,
      rawConfig: '{"enabled":true,"mentionUserIds":[]}',
    });
    context.safeJsonParse.mockReturnValue({
      enabled: true,
      mentionUserIds: [],
    });

    const result = await mutateBumpReminderConfigUseCase(
      context,
      "guild-3",
      (config) => ({
        result: BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED,
        updatedConfig: config,
        skipWrite: true,
      }),
    );

    expect(casUpdateMock).not.toHaveBeenCalled();
    expect(result).toBe(BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED);
  });

  // CAS が最大リトライ回数を超えて競合し続けた場合に DatabaseError をスローすること
  it("throws DatabaseError when CAS keeps conflicting", async () => {
    fetchSnapshotMock.mockResolvedValue({
      recordExists: true,
      rawConfig: '{"enabled":true,"mentionUserIds":[]}',
    });
    context.safeJsonParse.mockReturnValue({
      enabled: true,
      mentionUserIds: [],
    });
    casUpdateMock.mockResolvedValue(false);

    await expect(
      mutateBumpReminderConfigUseCase(context, "guild-4", (config) => ({
        result: BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED,
        updatedConfig: config,
      })),
    ).rejects.toMatchObject({ name: "DatabaseError" });
  });

  it("continues when initialization returns false and then succeeds on next snapshot", async () => {
    fetchSnapshotMock
      .mockResolvedValueOnce({ recordExists: false, rawConfig: null })
      .mockResolvedValueOnce({
        recordExists: true,
        rawConfig: '{"enabled":true,"mentionUserIds":[]}',
      });
    context.safeJsonParse
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ enabled: true, mentionUserIds: [] });
    initializeIfMissingMock.mockResolvedValueOnce(false);
    casUpdateMock.mockResolvedValueOnce(true);

    await expect(
      mutateBumpReminderConfigUseCase(
        context,
        "guild-init-false",
        (config) => ({
          result: BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED,
          updatedConfig: { ...config, mentionRoleId: "role-continue" },
        }),
      ),
    ).resolves.toBe(BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED);

    expect(initializeIfMissingMock).toHaveBeenCalledTimes(1);
    expect(casUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("handles mention user add/remove result branches", async () => {
    fetchSnapshotMock.mockResolvedValue({
      recordExists: true,
      rawConfig: '{"enabled":true,"mentionUserIds":["u1"]}',
    });
    context.safeJsonParse.mockReturnValue({
      enabled: true,
      mentionUserIds: ["u1"],
    });

    await expect(
      mutateBumpReminderMentionUsersUseCase(
        context,
        "guild-5",
        "u1",
        BUMP_REMINDER_MENTION_USER_MODE.ADD,
      ),
    ).resolves.toBe(BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS);

    await expect(
      mutateBumpReminderMentionUsersUseCase(
        context,
        "guild-5",
        "u2",
        BUMP_REMINDER_MENTION_USER_MODE.REMOVE,
      ),
    ).resolves.toBe(BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_FOUND);
  });

  it("updates mention users and returns added/removed when CAS succeeds", async () => {
    fetchSnapshotMock.mockResolvedValue({
      recordExists: true,
      rawConfig: '{"enabled":true,"mentionUserIds":[]}',
    });
    casUpdateMock.mockResolvedValue(true);

    context.safeJsonParse.mockReturnValue({
      enabled: true,
      mentionUserIds: [],
    });
    await expect(
      mutateBumpReminderMentionUsersUseCase(
        context,
        "guild-6",
        "u1",
        BUMP_REMINDER_MENTION_USER_MODE.ADD,
      ),
    ).resolves.toBe(BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED);

    context.safeJsonParse.mockReturnValue({
      enabled: true,
      mentionUserIds: ["u1"],
    });
    await expect(
      mutateBumpReminderMentionUsersUseCase(
        context,
        "guild-6",
        "u1",
        BUMP_REMINDER_MENTION_USER_MODE.REMOVE,
      ),
    ).resolves.toBe(BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED);

    expect(casUpdateMock).toHaveBeenCalled();
  });

  it("returns NOT_CONFIGURED for mention users when raw JSON exists but parse fails", async () => {
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: true,
      rawConfig: "invalid-json",
    });
    context.safeJsonParse.mockReturnValueOnce(undefined);

    await expect(
      mutateBumpReminderMentionUsersUseCase(
        context,
        "guild-raw-invalid",
        "u1",
        BUMP_REMINDER_MENTION_USER_MODE.ADD,
      ),
    ).resolves.toBe(BUMP_REMINDER_MENTION_USER_ADD_RESULT.NOT_CONFIGURED);
  });

  it("continues after initialize=false in mention users and then updates", async () => {
    fetchSnapshotMock
      .mockResolvedValueOnce({ recordExists: false, rawConfig: null })
      .mockResolvedValueOnce({
        recordExists: true,
        rawConfig: '{"enabled":true,"mentionUserIds":[]}',
      });
    context.safeJsonParse
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ enabled: true, mentionUserIds: [] });
    initializeIfMissingMock.mockResolvedValueOnce(false);
    casUpdateMock.mockResolvedValueOnce(true);

    await expect(
      mutateBumpReminderMentionUsersUseCase(
        context,
        "guild-mention-continue",
        "u1",
        BUMP_REMINDER_MENTION_USER_MODE.ADD,
      ),
    ).resolves.toBe(BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED);
  });

  it("throws DatabaseError when mention-user CAS keeps conflicting", async () => {
    fetchSnapshotMock.mockResolvedValue({
      recordExists: true,
      rawConfig: '{"enabled":true,"mentionUserIds":[]}',
    });
    context.safeJsonParse.mockReturnValue({
      enabled: true,
      mentionUserIds: [],
    });
    casUpdateMock.mockResolvedValue(false);

    await expect(
      mutateBumpReminderMentionUsersUseCase(
        context,
        "guild-mention-conflict",
        "u1",
        BUMP_REMINDER_MENTION_USER_MODE.ADD,
      ),
    ).rejects.toMatchObject({ name: "DatabaseError" });
  });

  // mentionUserIds が配列でない不正データを受け取った場合も空配列として正規化し ADD が成功すること
  it("normalizes non-array mentionUserIds in mention-user mutation", async () => {
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: true,
      rawConfig: '{"enabled":true,"mentionUserIds":"invalid"}',
    });
    context.safeJsonParse.mockReturnValueOnce({
      enabled: true,
      mentionUserIds: "invalid",
    });
    casUpdateMock.mockResolvedValueOnce(true);

    await expect(
      mutateBumpReminderMentionUsersUseCase(
        context,
        "guild-non-array",
        "u1",
        BUMP_REMINDER_MENTION_USER_MODE.ADD,
      ),
    ).resolves.toBe(BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED);
  });
});
