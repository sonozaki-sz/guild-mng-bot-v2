import type { IVacRepository } from "@/bot/features/vac/repositories";
import { cleanupVacOnStartupUseCase } from "@/bot/features/vac/services/usecases/cleanupVacOnStartup";
import { ChannelType } from "discord.js";

function createRepositoryMock(): jest.Mocked<IVacRepository> {
  return {
    getVacConfigOrDefault: jest.fn(),
    saveVacConfig: jest.fn(),
    addTriggerChannel: jest.fn(),
    removeTriggerChannel: jest.fn(),
    addCreatedVacChannel: jest.fn(),
    removeCreatedVacChannel: jest.fn(),
    isManagedVacChannel: jest.fn(),
  };
}

function createGuild(params: {
  guildId: string;
  fetchedChannels: Record<string, unknown | Error>;
}) {
  const fetchMock = jest.fn(async (channelId: string) => {
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
    jest.clearAllMocks();
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
          delete: jest.fn(),
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
          delete: jest.fn(),
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

    const deleteOk = jest.fn().mockResolvedValue(undefined);
    const deleteFail = jest.fn().mockRejectedValue(new Error("delete failed"));
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
});
