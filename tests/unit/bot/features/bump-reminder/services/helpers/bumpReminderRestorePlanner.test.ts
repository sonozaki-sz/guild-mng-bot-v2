import { createBumpReminderRestorePlan } from "@/bot/features/bump-reminder/services/helpers/bumpReminderRestorePlanner";

describe("bot/features/bump-reminder/services/helpers/bumpReminderRestorePlanner", () => {
  it("keeps latest reminder per guild and collects stale ones", () => {
    const reminders = [
      {
        id: "old",
        guildId: "g1",
        scheduledAt: new Date("2026-02-21T00:00:00.000Z"),
      },
      {
        id: "new",
        guildId: "g1",
        scheduledAt: new Date("2026-02-21T01:00:00.000Z"),
      },
      {
        id: "other",
        guildId: "g2",
        scheduledAt: new Date("2026-02-21T00:30:00.000Z"),
      },
    ];

    const result = createBumpReminderRestorePlan(reminders as never);

    expect(result.latestByGuild.get("g1")?.id).toBe("new");
    expect(result.latestByGuild.get("g2")?.id).toBe("other");
    expect(result.staleReminders.map((item) => item.id)).toEqual(["old"]);
  });

  it("treats same guild + different serviceName as independent entries", () => {
    const reminders = [
      {
        id: "disboard",
        guildId: "g1",
        serviceName: "Disboard",
        scheduledAt: new Date("2026-02-21T01:00:00.000Z"),
      },
      {
        id: "dissoku",
        guildId: "g1",
        serviceName: "Dissoku",
        scheduledAt: new Date("2026-02-21T00:30:00.000Z"),
      },
    ];

    const result = createBumpReminderRestorePlan(reminders as never);

    // 同一ギルドでもサービスが異なれば両方が latest として保持される
    expect(result.latestByGuild.get("g1:Disboard")?.id).toBe("disboard");
    expect(result.latestByGuild.get("g1:Dissoku")?.id).toBe("dissoku");
    expect(result.staleReminders).toHaveLength(0);
  });

  it("keeps latest per guild:service and marks older as stale", () => {
    const reminders = [
      {
        id: "disboard-old",
        guildId: "g1",
        serviceName: "Disboard",
        scheduledAt: new Date("2026-02-21T00:00:00.000Z"),
      },
      {
        id: "disboard-new",
        guildId: "g1",
        serviceName: "Disboard",
        scheduledAt: new Date("2026-02-21T01:00:00.000Z"),
      },
      {
        id: "dissoku",
        guildId: "g1",
        serviceName: "Dissoku",
        scheduledAt: new Date("2026-02-21T00:30:00.000Z"),
      },
    ];

    const result = createBumpReminderRestorePlan(reminders as never);

    expect(result.latestByGuild.get("g1:Disboard")?.id).toBe("disboard-new");
    expect(result.latestByGuild.get("g1:Dissoku")?.id).toBe("dissoku");
    expect(result.staleReminders.map((r) => r.id)).toEqual(["disboard-old"]);
  });
});
