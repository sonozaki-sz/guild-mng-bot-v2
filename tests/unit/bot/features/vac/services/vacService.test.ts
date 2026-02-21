import type { IVacRepository } from "@/bot/features/vac/repositories";
import { cleanupVacOnStartupUseCase } from "@/bot/features/vac/services/usecases/cleanupVacOnStartup";
import { handleVacCreateUseCase } from "@/bot/features/vac/services/usecases/handleVacCreate";
import { handleVacDeleteUseCase } from "@/bot/features/vac/services/usecases/handleVacDelete";
import {
  VacService,
  createVacService,
  getVacService,
} from "@/bot/features/vac/services/vacService";
import { ChannelType } from "discord.js";

const executeWithLoggedErrorMock = jest.fn(
  async (operation: () => Promise<void>, _message: string) => {
    await operation();
  },
);
const loggerInfoMock = jest.fn();
const getVacRepositoryMock = jest.fn();

jest.mock("@/shared/locale", () => ({
  tDefault: jest.fn((key: string) => `default:${key}`),
}));

jest.mock("@/shared/utils", () => ({
  executeWithLoggedError: (operation: () => Promise<void>, message: string) =>
    executeWithLoggedErrorMock(operation, message),
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

jest.mock("@/bot/features/vac/repositories", () => ({
  getVacRepository: (repository?: IVacRepository) =>
    getVacRepositoryMock(repository),
}));

jest.mock("@/bot/features/vac/services/usecases/handleVacCreate", () => ({
  handleVacCreateUseCase: jest.fn(),
}));

jest.mock("@/bot/features/vac/services/usecases/handleVacDelete", () => ({
  handleVacDeleteUseCase: jest.fn(),
}));

jest.mock("@/bot/features/vac/services/usecases/cleanupVacOnStartup", () => ({
  cleanupVacOnStartupUseCase: jest.fn(),
}));

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

describe("bot/features/vac/services/vacService", () => {
  const defaultRepository = createRepositoryMock();

  beforeEach(() => {
    jest.clearAllMocks();
    getVacRepositoryMock.mockImplementation(
      (repository?: IVacRepository) => repository ?? defaultRepository,
    );
  });

  it("delegates create/delete usecases when voice state changed", async () => {
    const repository = createRepositoryMock();
    const service = new VacService(repository);

    const oldState = { channelId: "old-1" };
    const newState = { guild: { id: "guild-1" }, channelId: "new-1" };

    await service.handleVoiceStateUpdate(oldState as never, newState as never);

    expect(executeWithLoggedErrorMock).toHaveBeenCalledTimes(1);
    expect(handleVacCreateUseCase).toHaveBeenCalledWith(repository, newState);
    expect(handleVacDeleteUseCase).toHaveBeenCalledWith(repository, oldState);
  });

  it("skips voice-state usecases when guild missing or channel unchanged", async () => {
    const repository = createRepositoryMock();
    const service = new VacService(repository);

    await service.handleVoiceStateUpdate(
      { channelId: "same" } as never,
      { guild: null, channelId: "other" } as never,
    );

    await service.handleVoiceStateUpdate(
      { channelId: "same" } as never,
      { guild: { id: "guild-1" }, channelId: "same" } as never,
    );

    expect(handleVacCreateUseCase).not.toHaveBeenCalled();
    expect(handleVacDeleteUseCase).not.toHaveBeenCalled();
  });

  it("syncs trigger and created-channel records on managed voice delete", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["voice-1"],
      createdChannels: [
        {
          voiceChannelId: "voice-1",
          ownerId: "user-1",
          createdAt: 1,
        },
      ],
    });
    const service = new VacService(repository);

    const channel = {
      id: "voice-1",
      guildId: "guild-1",
      type: ChannelType.GuildVoice,
      isDMBased: jest.fn(() => false),
    };

    await service.handleChannelDelete(channel as never);

    expect(repository.getVacConfigOrDefault).toHaveBeenCalledWith("guild-1");
    expect(repository.removeTriggerChannel).toHaveBeenCalledWith(
      "guild-1",
      "voice-1",
    );
    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "voice-1",
    );
    expect(loggerInfoMock).toHaveBeenCalledTimes(1);
  });

  it("ignores channel delete for DM-based and non-voice channels", async () => {
    const repository = createRepositoryMock();
    const service = new VacService(repository);

    await service.handleChannelDelete({
      isDMBased: jest.fn(() => true),
    } as never);

    await service.handleChannelDelete({
      isDMBased: jest.fn(() => false),
      type: ChannelType.GuildText,
    } as never);

    expect(repository.getVacConfigOrDefault).not.toHaveBeenCalled();
    expect(repository.removeTriggerChannel).not.toHaveBeenCalled();
    expect(repository.removeCreatedVacChannel).not.toHaveBeenCalled();
  });

  it("delegates startup cleanup usecase", async () => {
    const repository = createRepositoryMock();
    const service = new VacService(repository);
    const client = { guilds: { cache: new Map() } };

    await service.cleanupOnStartup(client as never);

    expect(cleanupVacOnStartupUseCase).toHaveBeenCalledWith(repository, client);
  });

  it("creates service instance from factory", () => {
    const repository = createRepositoryMock();

    const service = createVacService(repository);

    expect(service).toBeInstanceOf(VacService);
  });

  it("returns singleton and recreates when repository changes", () => {
    const repositoryA = createRepositoryMock();
    const repositoryB = createRepositoryMock();

    const serviceA1 = getVacService(repositoryA);
    const serviceA2 = getVacService(repositoryA);
    const serviceB = getVacService(repositoryB);

    expect(serviceA1).toBe(serviceA2);
    expect(serviceB).not.toBe(serviceA1);
  });
});
