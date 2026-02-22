import type { Mocked } from "vitest";
import type { IVacRepository } from "@/bot/features/vac/repositories/vacRepository";
import { cleanupVacOnStartupUseCase } from "@/bot/features/vac/services/usecases/cleanupVacOnStartup";
import { ChannelType } from "discord.js";

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

function createGuild(params: {
  guildId: string;
  fetchedChannels: Record<string, unknown | Error>;
}) {
  const fetchMock = vi.fn(async (channelId: string) => {
    const value = params.fetchedChannels[channelId];
    if (value instanceof Error) {
      throw value;
    }
    return value;
  });

  return {
    id: params.guildId,
    channels: {
      fetch: fetchMock,
    },
  };
}

describe("bot/features/vac/services/usecases/cleanupVacOnStartup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps valid trigger and non-empty managed voice channel", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-voice"],
      createdChannels: [
        {
          voiceChannelId: "created-non-empty",
          ownerId: "user-1",
          createdAt: 1,
        },
      ],
    });

    const guild = createGuild({
      guildId: "guild-1",
      fetchedChannels: {
        "trigger-voice": {
          id: "trigger-voice",
          type: ChannelType.GuildVoice,
        },
        "created-non-empty": {
          id: "created-non-empty",
          type: ChannelType.GuildVoice,
          isDMBased: () => false,
          members: { size: 2 },
          delete: vi.fn(),
        },
      },
    });

    const client = {
      guilds: {
        cache: new Map([[guild.id, guild]]),
      },
    };

    await cleanupVacOnStartupUseCase(repository, client as never);

    expect(repository.removeTriggerChannel).not.toHaveBeenCalled();
    expect(repository.removeCreatedVacChannel).not.toHaveBeenCalled();
  });

  it("removes invalid trigger and invalid managed channel records", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-missing", "trigger-text"],
      createdChannels: [
        {
          voiceChannelId: "created-missing",
          ownerId: "user-1",
          createdAt: 1,
        },
        {
          voiceChannelId: "created-text",
          ownerId: "user-1",
          createdAt: 2,
        },
      ],
    });

    const guild = createGuild({
      guildId: "guild-1",
      fetchedChannels: {
        "trigger-missing": null,
        "trigger-text": { id: "trigger-text", type: ChannelType.GuildText },
        "created-missing": null,
        "created-text": {
          id: "created-text",
          type: ChannelType.GuildText,
          isDMBased: () => false,
          members: { size: 0 },
          delete: vi.fn(),
        },
      },
    });

    const client = {
      guilds: {
        cache: new Map([[guild.id, guild]]),
      },
    };

    await cleanupVacOnStartupUseCase(repository, client as never);

    expect(repository.removeTriggerChannel).toHaveBeenCalledWith(
      "guild-1",
      "trigger-missing",
    );
    expect(repository.removeTriggerChannel).toHaveBeenCalledWith(
      "guild-1",
      "trigger-text",
    );
    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "created-missing",
    );
    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "created-text",
    );
  });

  it("deletes empty managed voice channel and still removes record on delete failure", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: [],
      createdChannels: [
        {
          voiceChannelId: "created-empty",
          ownerId: "user-1",
          createdAt: 1,
        },
        {
          voiceChannelId: "created-empty-delete-fail",
          ownerId: "user-1",
          createdAt: 2,
        },
      ],
    });

    const deleteOk = vi.fn().mockResolvedValue(undefined);
    const deleteFail = vi.fn().mockRejectedValue(new Error("delete failed"));
    const guild = createGuild({
      guildId: "guild-1",
      fetchedChannels: {
        "created-empty": {
          id: "created-empty",
          type: ChannelType.GuildVoice,
          isDMBased: () => false,
          members: { size: 0 },
          delete: deleteOk,
        },
        "created-empty-delete-fail": {
          id: "created-empty-delete-fail",
          type: ChannelType.GuildVoice,
          isDMBased: () => false,
          members: { size: 0 },
          delete: deleteFail,
        },
      },
    });

    const client = {
      guilds: {
        cache: new Map([[guild.id, guild]]),
      },
    };

    await cleanupVacOnStartupUseCase(repository, client as never);

    expect(deleteOk).toHaveBeenCalledTimes(1);
    expect(deleteFail).toHaveBeenCalledTimes(1);
    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "created-empty",
    );
    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "created-empty-delete-fail",
    );
  });

  it("treats fetch errors as missing channels and removes stale records", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-fetch-error"],
      createdChannels: [
        {
          voiceChannelId: "created-fetch-error",
          ownerId: "user-1",
          createdAt: 3,
        },
      ],
    });

    const guild = createGuild({
      guildId: "guild-2",
      fetchedChannels: {
        "trigger-fetch-error": new Error("fetch failed"),
        "created-fetch-error": new Error("fetch failed"),
      },
    });

    const client = {
      guilds: {
        cache: new Map([[guild.id, guild]]),
      },
    };

    await cleanupVacOnStartupUseCase(repository, client as never);

    expect(repository.removeTriggerChannel).toHaveBeenCalledWith(
      "guild-2",
      "trigger-fetch-error",
    );
    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-2",
      "created-fetch-error",
    );
  });
});
