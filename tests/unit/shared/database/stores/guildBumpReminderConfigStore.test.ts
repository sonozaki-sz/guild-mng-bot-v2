import type { MockedFunction } from "vitest";
import { GuildBumpReminderConfigStore } from "@/shared/database/stores/guildBumpReminderConfigStore";
import { getBumpReminderConfigUseCase } from "@/shared/database/stores/usecases/getBumpReminderConfig";
import {
  mutateBumpReminderConfigUseCase,
  mutateBumpReminderMentionUsersUseCase,
} from "@/shared/database/stores/usecases/mutateBumpReminderConfig";
import { setBumpReminderEnabledUseCase } from "@/shared/database/stores/usecases/setBumpReminderEnabled";
import { updateBumpReminderConfigUseCase } from "@/shared/database/stores/usecases/updateBumpReminderConfig";
import {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_MODE,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
} from "@/shared/database/types";

vi.mock("@/shared/database/stores/usecases/getBumpReminderConfig", () => ({
  getBumpReminderConfigUseCase: vi.fn(),
}));
vi.mock("@/shared/database/stores/usecases/setBumpReminderEnabled", () => ({
  setBumpReminderEnabledUseCase: vi.fn(),
}));
vi.mock("@/shared/database/stores/usecases/updateBumpReminderConfig", () => ({
  updateBumpReminderConfigUseCase: vi.fn(),
}));
vi.mock("@/shared/database/stores/usecases/mutateBumpReminderConfig", () => ({
  mutateBumpReminderConfigUseCase: vi.fn(),
  mutateBumpReminderMentionUsersUseCase: vi.fn(),
}));

describe("shared/database/stores/guildBumpReminderConfigStore", () => {
  const getConfigMock = getBumpReminderConfigUseCase as MockedFunction<
    typeof getBumpReminderConfigUseCase
  >;
  const setEnabledMock = setBumpReminderEnabledUseCase as MockedFunction<
    typeof setBumpReminderEnabledUseCase
  >;
  const updateConfigMock =
    updateBumpReminderConfigUseCase as MockedFunction<
      typeof updateBumpReminderConfigUseCase
    >;
  const mutateConfigMock =
    mutateBumpReminderConfigUseCase as MockedFunction<
      typeof mutateBumpReminderConfigUseCase
    >;
  const mutateUsersMock =
    mutateBumpReminderMentionUsersUseCase as MockedFunction<
      typeof mutateBumpReminderMentionUsersUseCase
    >;

  const createStore = () => {
    const prisma = { guildConfig: {} };
    const safeJsonParse = vi.fn();
    const store = new GuildBumpReminderConfigStore(
      prisma as never,
      "ja",
      safeJsonParse,
    );
    return { store, prisma, safeJsonParse };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates basic read/write operations to usecases", async () => {
    const { store, prisma, safeJsonParse } = createStore();
    getConfigMock.mockResolvedValueOnce({ enabled: true, mentionUserIds: [] });

    await expect(store.getBumpReminderConfig("g1")).resolves.toEqual({
      enabled: true,
      mentionUserIds: [],
    });
    await store.setBumpReminderEnabled("g1", true, "ch1");
    await store.updateBumpReminderConfig("g1", {
      enabled: true,
      mentionUserIds: [],
    } as never);

    expect(getConfigMock).toHaveBeenCalledWith(
      expect.objectContaining({ prisma, defaultLocale: "ja", safeJsonParse }),
      "g1",
    );
    expect(setEnabledMock).toHaveBeenCalledWith(
      expect.any(Object),
      "g1",
      true,
      "ch1",
    );
    expect(updateConfigMock).toHaveBeenCalledWith(
      expect.any(Object),
      "g1",
      expect.objectContaining({ enabled: true }),
    );
  });

  it("delegates mention-user add/remove operations", async () => {
    const { store } = createStore();
    mutateUsersMock.mockResolvedValue("ok-add" as never);

    await store.addBumpReminderMentionUser("g1", "u1");
    await store.removeBumpReminderMentionUser("g1", "u1");

    expect(mutateUsersMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      "g1",
      "u1",
      BUMP_REMINDER_MENTION_USER_MODE.ADD,
    );
    expect(mutateUsersMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      "g1",
      "u1",
      BUMP_REMINDER_MENTION_USER_MODE.REMOVE,
    );
  });

  it("setBumpReminderMentionRole normalizes mentionUserIds and returns UPDATED", async () => {
    const { store } = createStore();
    mutateConfigMock.mockImplementationOnce(
      async (_context, _guildId, mutator) => {
        const mutation = mutator({ enabled: true } as never);
        expect(mutation.result).toBe(BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED);
        expect(mutation.updatedConfig).toEqual({
          enabled: true,
          mentionRoleId: "role-1",
          mentionUserIds: [],
        });
        return mutation.result as never;
      },
    );

    await expect(
      store.setBumpReminderMentionRole("g1", "role-1"),
    ).resolves.toBe(BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED);
  });

  it("clearBumpReminderMentionUsers returns ALREADY_EMPTY with skipWrite", async () => {
    const { store } = createStore();
    mutateConfigMock.mockImplementationOnce(
      async (_context, _guildId, mutator) => {
        const mutation = mutator({
          enabled: true,
          mentionUserIds: [],
        } as never);
        expect(mutation.result).toBe(
          BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.ALREADY_EMPTY,
        );
        expect(mutation.skipWrite).toBe(true);
        return mutation.result as never;
      },
    );

    await expect(store.clearBumpReminderMentionUsers("g1")).resolves.toBe(
      BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.ALREADY_EMPTY,
    );
  });

  it("normalizes invalid mentionUserIds in clear methods", async () => {
    const { store } = createStore();
    mutateConfigMock
      .mockImplementationOnce(async (_context, _guildId, mutator) => {
        const mutation = mutator({
          enabled: true,
          mentionUserIds: "invalid",
        } as never);
        expect(mutation.result).toBe(
          BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.ALREADY_EMPTY,
        );
        expect(mutation.updatedConfig).toEqual(
          expect.objectContaining({ mentionUserIds: [] }),
        );
        return mutation.result as never;
      })
      .mockImplementationOnce(async (_context, _guildId, mutator) => {
        const mutation = mutator({
          enabled: true,
          mentionRoleId: undefined,
          mentionUserIds: "invalid",
        } as never);
        expect(mutation.result).toBe(
          BUMP_REMINDER_MENTION_CLEAR_RESULT.ALREADY_CLEARED,
        );
        expect(mutation.updatedConfig).toEqual(
          expect.objectContaining({ mentionUserIds: [] }),
        );
        return mutation.result as never;
      });

    await expect(store.clearBumpReminderMentionUsers("g1")).resolves.toBe(
      BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.ALREADY_EMPTY,
    );
    await expect(store.clearBumpReminderMentions("g1")).resolves.toBe(
      BUMP_REMINDER_MENTION_CLEAR_RESULT.ALREADY_CLEARED,
    );
  });

  it("clearBumpReminderMentionUsers returns CLEARED when users exist", async () => {
    const { store } = createStore();
    mutateConfigMock.mockImplementationOnce(
      async (_context, _guildId, mutator) => {
        const mutation = mutator({
          enabled: true,
          mentionUserIds: ["u1", "u2"],
        } as never);
        expect(mutation.result).toBe(
          BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.CLEARED,
        );
        expect(mutation.updatedConfig).toEqual({
          enabled: true,
          mentionUserIds: [],
        });
        return mutation.result as never;
      },
    );

    await expect(store.clearBumpReminderMentionUsers("g1")).resolves.toBe(
      BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.CLEARED,
    );
  });

  it("clearBumpReminderMentions handles already-cleared and cleared branches", async () => {
    const { store } = createStore();
    mutateConfigMock
      .mockImplementationOnce(async (_context, _guildId, mutator) => {
        const mutation = mutator({
          enabled: true,
          mentionRoleId: undefined,
          mentionUserIds: [],
        } as never);
        expect(mutation.result).toBe(
          BUMP_REMINDER_MENTION_CLEAR_RESULT.ALREADY_CLEARED,
        );
        expect(mutation.skipWrite).toBe(true);
        return mutation.result as never;
      })
      .mockImplementationOnce(async (_context, _guildId, mutator) => {
        const mutation = mutator({
          enabled: true,
          mentionRoleId: "role-1",
          mentionUserIds: ["u1"],
        } as never);
        expect(mutation.result).toBe(
          BUMP_REMINDER_MENTION_CLEAR_RESULT.CLEARED,
        );
        expect(mutation.updatedConfig).toEqual({
          enabled: true,
          mentionRoleId: undefined,
          mentionUserIds: [],
        });
        return mutation.result as never;
      });

    await expect(store.clearBumpReminderMentions("g1")).resolves.toBe(
      BUMP_REMINDER_MENTION_CLEAR_RESULT.ALREADY_CLEARED,
    );
    await expect(store.clearBumpReminderMentions("g1")).resolves.toBe(
      BUMP_REMINDER_MENTION_CLEAR_RESULT.CLEARED,
    );
  });
});
