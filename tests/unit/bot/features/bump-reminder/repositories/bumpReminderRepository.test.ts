const executeWithDatabaseErrorMock = jest.fn(
  async (fn: () => Promise<unknown>, _message?: string) => fn(),
);

const loggerDebugMock = jest.fn();
const loggerInfoMock = jest.fn();

const createBumpReminderUseCaseMock = jest.fn();
const findBumpReminderByIdUseCaseMock = jest.fn();
const findPendingByGuildUseCaseMock = jest.fn();
const findAllPendingUseCaseMock = jest.fn();
const updateReminderStatusUseCaseMock = jest.fn();
const deleteBumpReminderUseCaseMock = jest.fn();
const cancelPendingByGuildUseCaseMock = jest.fn();
const cancelPendingByGuildAndChannelUseCaseMock = jest.fn();
const cleanupOldBumpRemindersUseCaseMock = jest.fn();

jest.mock("@/shared/utils/errorHandling", () => ({
  executeWithDatabaseError: (fn: () => Promise<unknown>, message: string) =>
    executeWithDatabaseErrorMock(fn, message),
}));

jest.mock("@/shared/utils/logger", () => ({
  logger: {
    debug: (...args: unknown[]) => loggerDebugMock(...args),
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

jest.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string) => key,
}));

jest.mock(
  "@/bot/features/bump-reminder/repositories/usecases/createBumpReminder",
  () => ({
    createBumpReminderUseCase: (...args: unknown[]) =>
      createBumpReminderUseCaseMock(...args),
  }),
);
jest.mock(
  "@/bot/features/bump-reminder/repositories/usecases/findBumpReminderById",
  () => ({
    findBumpReminderByIdUseCase: (...args: unknown[]) =>
      findBumpReminderByIdUseCaseMock(...args),
  }),
);
jest.mock(
  "@/bot/features/bump-reminder/repositories/usecases/findPendingReminders",
  () => ({
    findPendingByGuildUseCase: (...args: unknown[]) =>
      findPendingByGuildUseCaseMock(...args),
    findAllPendingUseCase: (...args: unknown[]) =>
      findAllPendingUseCaseMock(...args),
  }),
);
jest.mock(
  "@/bot/features/bump-reminder/repositories/usecases/updateBumpReminderStatus",
  () => ({
    updateReminderStatusUseCase: (...args: unknown[]) =>
      updateReminderStatusUseCaseMock(...args),
    cancelPendingByGuildUseCase: (...args: unknown[]) =>
      cancelPendingByGuildUseCaseMock(...args),
    cancelPendingByGuildAndChannelUseCase: (...args: unknown[]) =>
      cancelPendingByGuildAndChannelUseCaseMock(...args),
  }),
);
jest.mock(
  "@/bot/features/bump-reminder/repositories/usecases/deleteBumpReminder",
  () => ({
    deleteBumpReminderUseCase: (...args: unknown[]) =>
      deleteBumpReminderUseCaseMock(...args),
  }),
);
jest.mock(
  "@/bot/features/bump-reminder/repositories/usecases/cleanupBumpReminders",
  () => ({
    cleanupOldBumpRemindersUseCase: (...args: unknown[]) =>
      cleanupOldBumpRemindersUseCaseMock(...args),
  }),
);

describe("bot/features/bump-reminder/repositories/bumpReminderRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates CRUD-style operations to usecases", async () => {
    const now = new Date("2026-02-21T00:00:00.000Z");
    const created = { id: "r1", guildId: "g1" };

    createBumpReminderUseCaseMock.mockResolvedValue(created);
    findBumpReminderByIdUseCaseMock.mockResolvedValue(created);
    findPendingByGuildUseCaseMock.mockResolvedValue(created);
    findAllPendingUseCaseMock.mockResolvedValue([created]);
    updateReminderStatusUseCaseMock.mockResolvedValue(undefined);
    deleteBumpReminderUseCaseMock.mockResolvedValue(undefined);
    cancelPendingByGuildUseCaseMock.mockResolvedValue(undefined);
    cancelPendingByGuildAndChannelUseCaseMock.mockResolvedValue(undefined);
    cleanupOldBumpRemindersUseCaseMock.mockResolvedValue(3);

    const { BumpReminderRepository } =
      await import("@/bot/features/bump-reminder/repositories/bumpReminderRepository");
    const repository = new BumpReminderRepository({} as never);

    await expect(
      repository.create("g1", "c1", now, "m1", "p1", "Disboard"),
    ).resolves.toBe(created);
    await expect(repository.findById("r1")).resolves.toBe(created);
    await expect(repository.findPendingByGuild("g1")).resolves.toBe(created);
    await expect(repository.findAllPending()).resolves.toEqual([created]);
    await expect(
      repository.updateStatus("r1", "pending" as never),
    ).resolves.toBeUndefined();
    await expect(repository.delete("r1")).resolves.toBeUndefined();
    await expect(repository.cancelByGuild("g1")).resolves.toBeUndefined();
    await expect(
      repository.cancelByGuildAndChannel("g1", "c1"),
    ).resolves.toBeUndefined();
    await expect(repository.cleanupOld()).resolves.toBe(3);

    expect(createBumpReminderUseCaseMock).toHaveBeenCalledWith(
      expect.anything(),
      "g1",
      "c1",
      now,
      "m1",
      "p1",
      "Disboard",
    );
    expect(findBumpReminderByIdUseCaseMock).toHaveBeenCalledWith(
      expect.anything(),
      "r1",
    );
    expect(findPendingByGuildUseCaseMock).toHaveBeenCalledWith(
      expect.anything(),
      "g1",
    );
    expect(findAllPendingUseCaseMock).toHaveBeenCalledWith(expect.anything());
    expect(updateReminderStatusUseCaseMock).toHaveBeenCalledWith(
      expect.anything(),
      "r1",
      "pending",
    );
    expect(deleteBumpReminderUseCaseMock).toHaveBeenCalledWith(
      expect.anything(),
      "r1",
    );
    expect(cancelPendingByGuildUseCaseMock).toHaveBeenCalledWith(
      expect.anything(),
      "g1",
    );
    expect(cancelPendingByGuildAndChannelUseCaseMock).toHaveBeenCalledWith(
      expect.anything(),
      "g1",
      "c1",
    );
    expect(cleanupOldBumpRemindersUseCaseMock).toHaveBeenCalledWith(
      expect.anything(),
      7,
    );
    expect(executeWithDatabaseErrorMock).toHaveBeenCalled();
    expect(loggerDebugMock).toHaveBeenCalled();
    expect(loggerInfoMock).toHaveBeenCalled();
  });

  it("reuses singleton for same prisma and recreates for different prisma", async () => {
    const { getBumpReminderRepository } =
      await import("@/bot/features/bump-reminder/repositories/bumpReminderRepository");

    const prismaA = {};
    const prismaB = {};

    const a1 = getBumpReminderRepository(prismaA as never);
    const a2 = getBumpReminderRepository(prismaA as never);
    const b1 = getBumpReminderRepository(prismaB as never);

    expect(a1).toBe(a2);
    expect(a1).not.toBe(b1);
  });
});
