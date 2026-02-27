// tests/unit/bot/features/sticky-message/repositories/stickyMessageRepository.test.ts
import type { Mock } from "vitest";

const executeWithDatabaseErrorMock: Mock = vi.fn(async (fn: () => unknown) =>
  fn(),
);

vi.mock("@/shared/utils/errorHandling", () => ({
  executeWithDatabaseError: executeWithDatabaseErrorMock,
}));

function createPrismaMock(): {
  stickyMessage: {
    findUnique: Mock;
    findMany: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    deleteMany: Mock;
  };
} {
  return {
    stickyMessage: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

describe("bot/features/sticky-message/repositories/stickyMessageRepository", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    executeWithDatabaseErrorMock.mockImplementation(async (fn: () => unknown) =>
      fn(),
    );
  });

  async function loadModule() {
    const mod =
      await import("@/bot/features/sticky-message/repositories/stickyMessageRepository");
    return mod;
  }

  it("findByChannel delegates to prisma.stickyMessage.findUnique", async () => {
    const prisma = createPrismaMock();
    const expected = { id: "s1", channelId: "ch-1", content: "hi" };
    prisma.stickyMessage.findUnique.mockResolvedValue(expected);

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    const result = await repo.findByChannel("ch-1");

    expect(prisma.stickyMessage.findUnique).toHaveBeenCalledWith({
      where: { channelId: "ch-1" },
    });
    expect(result).toBe(expected);
  });

  it("findAllByGuild delegates to prisma.stickyMessage.findMany", async () => {
    const prisma = createPrismaMock();
    const expected = [{ id: "s1" }, { id: "s2" }];
    prisma.stickyMessage.findMany.mockResolvedValue(expected);

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    const result = await repo.findAllByGuild("guild-1");

    expect(prisma.stickyMessage.findMany).toHaveBeenCalledWith({
      where: { guildId: "guild-1" },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toBe(expected);
  });

  it("create delegates to prisma.stickyMessage.create with all fields", async () => {
    const prisma = createPrismaMock();
    const expected = { id: "s1" };
    prisma.stickyMessage.create.mockResolvedValue(expected);

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    const result = await repo.create(
      "guild-1",
      "ch-1",
      "hello",
      '{"title":"t"}',
      "user-1",
    );

    expect(prisma.stickyMessage.create).toHaveBeenCalledWith({
      data: {
        guildId: "guild-1",
        channelId: "ch-1",
        content: "hello",
        embedData: '{"title":"t"}',
        updatedBy: "user-1",
      },
    });
    expect(result).toBe(expected);
  });

  it("create uses null for undefined embedData and updatedBy", async () => {
    const prisma = createPrismaMock();
    prisma.stickyMessage.create.mockResolvedValue({ id: "s1" });

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    await repo.create("guild-1", "ch-1", "hello");

    expect(prisma.stickyMessage.create).toHaveBeenCalledWith({
      data: {
        guildId: "guild-1",
        channelId: "ch-1",
        content: "hello",
        embedData: null,
        updatedBy: null,
      },
    });
  });

  it("updateLastMessageId delegates to prisma.stickyMessage.update", async () => {
    const prisma = createPrismaMock();
    prisma.stickyMessage.update.mockResolvedValue(undefined);

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    await repo.updateLastMessageId("s1", "msg-123");

    expect(prisma.stickyMessage.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { lastMessageId: "msg-123" },
    });
  });

  it("updateContent delegates to prisma with embedData and updatedBy", async () => {
    const prisma = createPrismaMock();
    const expected = { id: "s1", content: "new" };
    prisma.stickyMessage.update.mockResolvedValue(expected);

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    const result = await repo.updateContent(
      "s1",
      "new",
      '{"title":"t"}',
      "user-1",
    );

    expect(prisma.stickyMessage.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: {
        content: "new",
        embedData: '{"title":"t"}',
        lastMessageId: null,
        updatedBy: "user-1",
      },
    });
    expect(result).toBe(expected);
  });

  it("updateContent skips updatedBy when not provided", async () => {
    const prisma = createPrismaMock();
    prisma.stickyMessage.update.mockResolvedValue({ id: "s1" });

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    await repo.updateContent("s1", "new", null);

    expect(prisma.stickyMessage.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: {
        content: "new",
        embedData: null,
        lastMessageId: null,
      },
    });
  });

  it("delete delegates to prisma.stickyMessage.delete", async () => {
    const prisma = createPrismaMock();
    prisma.stickyMessage.delete.mockResolvedValue(undefined);

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    await repo.delete("s1");

    expect(prisma.stickyMessage.delete).toHaveBeenCalledWith({
      where: { id: "s1" },
    });
  });

  it("deleteByChannel delegates to prisma.stickyMessage.deleteMany", async () => {
    const prisma = createPrismaMock();
    prisma.stickyMessage.deleteMany.mockResolvedValue(undefined);

    const { StickyMessageRepository } = await loadModule();
    const repo = new StickyMessageRepository(prisma as never);
    await repo.deleteByChannel("ch-1");

    expect(prisma.stickyMessage.deleteMany).toHaveBeenCalledWith({
      where: { channelId: "ch-1" },
    });
  });

  it("getStickyMessageRepository throws when not initialized without prisma", async () => {
    const { getStickyMessageRepository } = await loadModule();

    expect(() => getStickyMessageRepository()).toThrow(
      "StickyMessageRepository is not initialized",
    );
  });

  it("getStickyMessageRepository initializes with prisma and returns singleton", async () => {
    const prisma = createPrismaMock();
    const { getStickyMessageRepository, StickyMessageRepository } =
      await loadModule();

    const repo = getStickyMessageRepository(prisma as never);
    expect(repo).toBeInstanceOf(StickyMessageRepository);

    // Second call returns same instance
    const repo2 = getStickyMessageRepository();
    expect(repo).toBe(repo2);
  });
});
