import { findStickMessagesJson } from "@/shared/database/repositories/persistence/guildConfigReadPersistence";
import { GuildStickMessageStore } from "@/shared/database/stores/guildStickMessageStore";

jest.mock(
  "@/shared/database/repositories/persistence/guildConfigReadPersistence",
  () => ({
    findStickMessagesJson: jest.fn(),
  }),
);

describe("shared/database/stores/guildStickMessageStore", () => {
  const findStickMessagesJsonMock =
    findStickMessagesJson as jest.MockedFunction<typeof findStickMessagesJson>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed stick messages", async () => {
    const parsed = [{ channelId: "ch-1", messageId: "msg-1" }];
    const safeJsonParse = jest.fn().mockReturnValue(parsed);
    const updateConfig = jest.fn();
    const prisma = { guildConfig: { findUnique: jest.fn() } };

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
    const safeJsonParse = jest.fn().mockReturnValue(undefined);
    const updateConfig = jest.fn();
    const prisma = { guildConfig: { findUnique: jest.fn() } };

    findStickMessagesJsonMock.mockResolvedValue("invalid");

    const store = new GuildStickMessageStore(
      prisma as never,
      safeJsonParse,
      updateConfig,
    );

    await expect(store.getStickMessages("guild-2")).resolves.toEqual([]);
  });

  it("delegates update through shared updateConfig path", async () => {
    const safeJsonParse = jest.fn();
    const updateConfig = jest.fn().mockResolvedValue(undefined);
    const prisma = { guildConfig: { findUnique: jest.fn() } };

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
