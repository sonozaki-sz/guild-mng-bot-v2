import type { Mocked } from "vitest";
import type { IVacRepository } from "@/bot/features/vac/repositories/vacRepository";
import { handleVacDeleteUseCase } from "@/bot/features/vac/services/usecases/handleVacDelete";
import { ChannelType } from "discord.js";

const loggerInfoMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

function createRepositoryMock(): Mocked<IVacRepository> {
  return {
    getVacConfigOrDefault: vi.fn(),
    saveVacConfig: vi.fn(),
    addTriggerChannel: vi.fn(),
    removeTriggerChannel: vi.fn(),
    addCreatedVacChannel: vi.fn(),
    removeCreatedVacChannel: vi.fn(),
    isManagedVacChannel: vi.fn(),
  };
}

describe("bot/features/vac/services/usecases/handleVacDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns when oldState has no channel", async () => {
    const repository = createRepositoryMock();

    await handleVacDeleteUseCase(repository, { channel: null } as never);

    expect(repository.getVacConfigOrDefault).not.toHaveBeenCalled();
  });

  it("returns when old channel is not a voice channel", async () => {
    const repository = createRepositoryMock();

    await handleVacDeleteUseCase(repository, {
      channel: { type: ChannelType.GuildText },
    } as never);

    expect(repository.getVacConfigOrDefault).not.toHaveBeenCalled();
  });

  it("returns when old channel is not managed by VAC", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [],
    });
    const deleteMock = vi.fn().mockResolvedValue(undefined);

    await handleVacDeleteUseCase(repository, {
      channel: {
        id: "voice-1",
        guild: { id: "guild-1" },
        type: ChannelType.GuildVoice,
        members: { size: 0 },
        delete: deleteMock,
      },
    } as never);

    expect(deleteMock).not.toHaveBeenCalled();
    expect(repository.removeCreatedVacChannel).not.toHaveBeenCalled();
    expect(loggerInfoMock).not.toHaveBeenCalled();
  });

  it("returns when managed channel still has members", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [
        {
          voiceChannelId: "voice-1",
          ownerId: "user-1",
          createdAt: 1,
        },
      ],
    });
    const deleteMock = vi.fn().mockResolvedValue(undefined);

    await handleVacDeleteUseCase(repository, {
      channel: {
        id: "voice-1",
        guild: { id: "guild-1" },
        type: ChannelType.GuildVoice,
        members: { size: 2 },
        delete: deleteMock,
      },
    } as never);

    expect(deleteMock).not.toHaveBeenCalled();
    expect(repository.removeCreatedVacChannel).not.toHaveBeenCalled();
    expect(loggerInfoMock).not.toHaveBeenCalled();
  });

  it("deletes managed empty channel and removes record", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [
        {
          voiceChannelId: "voice-1",
          ownerId: "user-1",
          createdAt: 1,
        },
      ],
    });
    const deleteMock = vi.fn().mockResolvedValue(undefined);

    await handleVacDeleteUseCase(repository, {
      channel: {
        id: "voice-1",
        guild: { id: "guild-1" },
        type: ChannelType.GuildVoice,
        members: { size: 0 },
        delete: deleteMock,
      },
    } as never);

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "voice-1",
    );
    expect(loggerInfoMock).toHaveBeenCalledTimes(1);
  });

  it("continues cleanup even when channel delete fails", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [
        {
          voiceChannelId: "voice-1",
          ownerId: "user-1",
          createdAt: 1,
        },
      ],
    });
    const deleteMock = vi.fn().mockRejectedValue(new Error("delete failed"));

    await handleVacDeleteUseCase(repository, {
      channel: {
        id: "voice-1",
        guild: { id: "guild-1" },
        type: ChannelType.GuildVoice,
        members: { size: 0 },
        delete: deleteMock,
      },
    } as never);

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "voice-1",
    );
  });
});
