import { findMemberLogConfigJson } from "@/shared/database/repositories/persistence/guildConfigReadPersistence";
import { GuildMemberLogConfigStore } from "@/shared/database/stores/guildMemberLogConfigStore";

jest.mock(
  "@/shared/database/repositories/persistence/guildConfigReadPersistence",
  () => ({
    findMemberLogConfigJson: jest.fn(),
  }),
);

describe("shared/database/stores/guildMemberLogConfigStore", () => {
  const findMemberLogConfigJsonMock =
    findMemberLogConfigJson as jest.MockedFunction<
      typeof findMemberLogConfigJson
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed member log config", async () => {
    const safeJsonParse = jest.fn().mockReturnValue({ channelId: "ch-1" });
    const updateConfig = jest.fn();
    const prisma = { guildConfig: { findUnique: jest.fn() } };

    findMemberLogConfigJsonMock.mockResolvedValue('{"channelId":"ch-1"}');

    const store = new GuildMemberLogConfigStore(
      prisma as never,
      safeJsonParse,
      updateConfig,
    );

    await expect(store.getMemberLogConfig("guild-1")).resolves.toEqual({
      channelId: "ch-1",
    });
    expect(findMemberLogConfigJsonMock).toHaveBeenCalledWith(prisma, "guild-1");
    expect(safeJsonParse).toHaveBeenCalledWith('{"channelId":"ch-1"}');
  });

  it("returns null when parser returns undefined", async () => {
    const safeJsonParse = jest.fn().mockReturnValue(undefined);
    const updateConfig = jest.fn();
    const prisma = { guildConfig: { findUnique: jest.fn() } };

    findMemberLogConfigJsonMock.mockResolvedValue("broken");

    const store = new GuildMemberLogConfigStore(
      prisma as never,
      safeJsonParse,
      updateConfig,
    );

    await expect(store.getMemberLogConfig("guild-2")).resolves.toBeNull();
  });

  it("delegates update through shared updateConfig path", async () => {
    const safeJsonParse = jest.fn();
    const updateConfig = jest.fn().mockResolvedValue(undefined);
    const prisma = { guildConfig: { findUnique: jest.fn() } };

    const store = new GuildMemberLogConfigStore(
      prisma as never,
      safeJsonParse,
      updateConfig,
    );

    const payload = { channelId: "member-log" };
    await store.updateMemberLogConfig("guild-3", payload);

    expect(updateConfig).toHaveBeenCalledWith("guild-3", {
      memberLogConfig: payload,
    });
  });
});
