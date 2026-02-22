import type { MockedFunction } from "vitest";
import { findStickMessagesJson } from "@/shared/database/repositories/persistence/guildConfigReadPersistence";
import { GuildStickMessageStore } from "@/shared/database/stores/guildStickMessageStore";

vi.mock(
  "@/shared/database/repositories/persistence/guildConfigReadPersistence",
  () => ({
    findStickMessagesJson: vi.fn(),
  }),
);

describe("shared/database/stores/guildStickMessageStore", () => {
  const findStickMessagesJsonMock =
    findStickMessagesJson as MockedFunction<typeof findStickMessagesJson>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed stick messages", async () => {
    const parsed = [{ channelId: "ch-1", messageId: "msg-1" }];
    const safeJsonParse = vi.fn().mockReturnValue(parsed);
    const updateConfig = vi.fn();
    const prisma = { guildConfig: { findUnique: vi.fn() } };

    findStickMessagesJsonMock.mockResolvedValue(
      '[{"channelId":"ch-1","messageId":"msg-1"}]',
    );

    const store = new GuildStickMessageStore(
      prisma as never,
      safeJsonParse,
      updateConfig,
    );

    await expect(store.getStickMessages("guild-1")).resolves.toEqual(parsed);
    expect(findStickMessagesJsonMock).toHaveBeenCalledWith(prisma, "guild-1");
  });

  it("returns empty array when parser returns undefined", async () => {
    const safeJsonParse = vi.fn().mockReturnValue(undefined);
    const updateConfig = vi.fn();
    const prisma = { guildConfig: { findUnique: vi.fn() } };

    findStickMessagesJsonMock.mockResolvedValue("invalid");

    const store = new GuildStickMessageStore(
      prisma as never,
      safeJsonParse,
      updateConfig,
    );

    await expect(store.getStickMessages("guild-2")).resolves.toEqual([]);
  });

  it("delegates update through shared updateConfig path", async () => {
    const safeJsonParse = vi.fn();
    const updateConfig = vi.fn().mockResolvedValue(undefined);
    const prisma = { guildConfig: { findUnique: vi.fn() } };

    const store = new GuildStickMessageStore(
      prisma as never,
      safeJsonParse,
      updateConfig,
    );

    const payload = [{ channelId: "ch-2", messageId: "msg-2" }];
    await store.updateStickMessages("guild-3", payload);

    expect(updateConfig).toHaveBeenCalledWith("guild-3", {
      stickMessages: payload,
    });
  });
});
