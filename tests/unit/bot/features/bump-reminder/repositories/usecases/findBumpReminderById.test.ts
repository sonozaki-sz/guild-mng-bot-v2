// tests/unit/bot/features/bump-reminder/repositories/usecases/findBumpReminderById.test.ts
import { findBumpReminderByIdUseCase } from "@/bot/features/bump-reminder/repositories/usecases/findBumpReminderById";

describe("bot/features/bump-reminder/repositories/usecases/findBumpReminderById", () => {
  it("finds reminder by id", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "r1" });
    const prisma = { bumpReminder: { findUnique } };

    const result = await findBumpReminderByIdUseCase(prisma as never, "r1");

    expect(result).toEqual({ id: "r1" });
    expect(findUnique).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
