// tests/unit/bot/events/guildMemberRemove.test.ts
import { guildMemberRemoveEvent } from "@/bot/events/guildMemberRemove";
import { Events } from "discord.js";

const handleGuildMemberRemoveMock = vi.fn();

vi.mock("@/bot/features/member-log/handlers/guildMemberRemoveHandler", () => ({
  handleGuildMemberRemove: (...args: unknown[]) =>
    handleGuildMemberRemoveMock(...args),
}));

// guildMemberRemove イベントのメタデータと委譲を検証
describe("bot/events/guildMemberRemove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // イベント名と once フラグが正しいことを確認
  it("イベントメタデータが正しい", () => {
    expect(guildMemberRemoveEvent.name).toBe(Events.GuildMemberRemove);
    expect(guildMemberRemoveEvent.once).toBe(false);
  });

  // execute が handleGuildMemberRemove へ member を渡すことを検証
  it("handleGuildMemberRemove へ委譲する", async () => {
    const member = { id: "member-1" } as never;
    handleGuildMemberRemoveMock.mockResolvedValue(undefined);

    await guildMemberRemoveEvent.execute(member);

    expect(handleGuildMemberRemoveMock).toHaveBeenCalledWith(member);
  });
});
