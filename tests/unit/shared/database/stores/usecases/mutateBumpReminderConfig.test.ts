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

jest.mock("@/shared/locale", () => ({
  tDefault: jest.fn(() => "db-update-failed"),
}));

jest.mock("@/shared/database/stores/helpers/bumpReminderConfigCas", () => ({
  BUMP_REMINDER_CAS_MAX_RETRIES: 3,
  fetchBumpReminderConfigSnapshot: jest.fn(),
  initializeBumpReminderConfigIfMissing: jest.fn(),
  createInitialBumpReminderConfig: jest.fn(() => ({
    enabled: true,
    mentionUserIds: [],
  })),
  casUpdateBumpReminderConfig: jest.fn(),
}));

describe("shared/database/stores/usecases/mutateBumpReminderConfig", () => {
  const fetchSnapshotMock =
    fetchBumpReminderConfigSnapshot as jest.MockedFunction<
      typeof fetchBumpReminderConfigSnapshot
    >;
  const initializeIfMissingMock =
    initializeBumpReminderConfigIfMissing as jest.MockedFunction<
      typeof initializeBumpReminderConfigIfMissing
    >;
  const createInitialMock =
    createInitialBumpReminderConfig as jest.MockedFunction<
      typeof createInitialBumpReminderConfig
    >;
  const casUpdateMock = casUpdateBumpReminderConfig as jest.MockedFunction<
    typeof casUpdateBumpReminderConfig
  >;

  const context = {
    prisma: { guildConfig: {} } as never,
    defaultLocale: "ja",
    safeJsonParse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
});
