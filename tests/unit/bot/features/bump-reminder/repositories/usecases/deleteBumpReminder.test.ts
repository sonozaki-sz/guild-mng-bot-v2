// tests/unit/bot/features/bump-reminder/repositories/usecases/deleteBumpReminder.test.ts
import { deleteBumpReminderUseCase } from "@/bot/features/bump-reminder/repositories/usecases/deleteBumpReminder";

describe("bot/features/bump-reminder/repositories/usecases/deleteBumpReminder", () => {
  it("deletes reminder by id", async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const prisma = { bumpReminder: { delete: del } };

    await deleteBumpReminderUseCase(prisma as never, "r1");

    expect(del).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
