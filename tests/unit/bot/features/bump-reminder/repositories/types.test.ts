import type {
  BumpReminder,
  IBumpReminderRepository,
} from "@/bot/features/bump-reminder/repositories/types";

describe("bot/features/bump-reminder/repositories/types", () => {
  it("accepts bump reminder shape", () => {
    const reminder: BumpReminder = {
      id: "r1",
      guildId: "g1",
      channelId: "c1",
      messageId: null,
      panelMessageId: null,
      serviceName: null,
      scheduledAt: new Date(),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const repository: Pick<IBumpReminderRepository, "findById"> = {
      findById: vi.fn().mockResolvedValue(reminder),
    };

    expect(reminder.guildId).toBe("g1");
    expect(typeof repository.findById).toBe("function");
  });
});
