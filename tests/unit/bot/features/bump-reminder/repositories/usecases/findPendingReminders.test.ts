import { BUMP_REMINDER_STATUS } from "@/bot/features/bump-reminder/constants/bumpReminderConstants";
import {
  findAllPendingUseCase,
  findPendingByGuildUseCase,
} from "@/bot/features/bump-reminder/repositories/usecases/findPendingReminders";

describe("bot/features/bump-reminder/repositories/usecases/findPendingReminders", () => {
  it("finds next pending reminder for guild", async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: "r1" });
    const prisma = { bumpReminder: { findFirst } };

    const result = await findPendingByGuildUseCase(prisma as never, "guild-1");

    expect(result).toEqual({ id: "r1" });
    expect(findFirst).toHaveBeenCalledWith({
      where: { guildId: "guild-1", status: BUMP_REMINDER_STATUS.PENDING },
      orderBy: { scheduledAt: "asc" },
    });
  });

  it("finds all pending reminders ordered by schedule", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "r1" }, { id: "r2" }]);
    const prisma = { bumpReminder: { findMany } };

    const result = await findAllPendingUseCase(prisma as never);

    expect(result).toEqual([{ id: "r1" }, { id: "r2" }]);
    expect(findMany).toHaveBeenCalledWith({
      where: { status: BUMP_REMINDER_STATUS.PENDING },
      orderBy: { scheduledAt: "asc" },
    });
  });
});
