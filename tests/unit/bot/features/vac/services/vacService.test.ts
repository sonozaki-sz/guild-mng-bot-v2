// tests/unit/bot/features/vac/services/vacService.test.ts
import type { IVacRepository } from "@/bot/features/vac/repositories/vacRepository";
import { cleanupVacOnStartupUseCase } from "@/bot/features/vac/services/usecases/cleanupVacOnStartup";
import { handleVacCreateUseCase } from "@/bot/features/vac/services/usecases/handleVacCreate";
import { handleVacDeleteUseCase } from "@/bot/features/vac/services/usecases/handleVacDelete";
import {
  VacService,
  createVacService,
  getVacService,
} from "@/bot/features/vac/services/vacService";
import { ChannelType } from "discord.js";
import type { Mocked } from "vitest";

const executeWithLoggedErrorMock = vi.fn(
  async (operation: () => Promise<void>, _message: string) => {
    await operation();
  },
);
const loggerInfoMock = vi.fn();
const getVacRepositoryMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
}));

vi.mock("@/shared/utils/errorHandling", () => ({
  executeWithLoggedError: (operation: () => Promise<void>, message: string) =>
    executeWithLoggedErrorMock(operation, message),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
  },
}));

vi.mock("@/bot/features/vac/repositories/vacRepository", () => ({
  getVacRepository: (repository?: IVacRepository) =>
    getVacRepositoryMock(repository),
}));

vi.mock("@/bot/features/vac/services/usecases/handleVacCreate", () => ({
  handleVacCreateUseCase: vi.fn(),
}));

vi.mock("@/bot/features/vac/services/usecases/handleVacDelete", () => ({
  handleVacDeleteUseCase: vi.fn(),
}));

vi.mock("@/bot/features/vac/services/usecases/cleanupVacOnStartup", () => ({
  cleanupVacOnStartupUseCase: vi.fn(),
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

// VacService クラスがボイス状態変化・チャンネル削除・起動時クリーンアップの各しきいを
// 適切なユースケースに委譲し、シングルトン管理も正しく機能することを検証するテスト群
describe("bot/features/vac/services/vacService", () => {
  const defaultRepository = createRepositoryMock();

  // 各テストのモック呼び出し記録をリセットし、
  // getVacRepositoryMock が注入されたリポジトリをそのまま返すデフォルト動作を再設定する
  beforeEach(() => {
    vi.clearAllMocks();
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

  // guild が null の場合と、同じチャンネルに留まった場合の 2 つのガード条件を一洿で検証
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

  // トリガーチャンネルにも作成チャンネルにも登録されているボイスチャンネルが削除された際に
  // 両方のレコードが同時に確実に削除されることを検証
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
      isDMBased: vi.fn(() => false),
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

  it("does not remove records when deleted voice channel is not tracked", async () => {
    const repository = createRepositoryMock();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [
        {
          voiceChannelId: "managed-1",
          ownerId: "user-1",
          createdAt: 1,
        },
      ],
    });
    const service = new VacService(repository);

    const channel = {
      id: "other-voice",
      guildId: "guild-1",
      type: ChannelType.GuildVoice,
      isDMBased: vi.fn(() => false),
    };

    await service.handleChannelDelete(channel as never);

    expect(repository.removeTriggerChannel).not.toHaveBeenCalled();
    expect(repository.removeCreatedVacChannel).not.toHaveBeenCalled();
  });

  it("ignores channel delete for DM-based and non-voice channels", async () => {
    const repository = createRepositoryMock();
    const service = new VacService(repository);

    await service.handleChannelDelete({
      isDMBased: vi.fn(() => true),
    } as never);

    await service.handleChannelDelete({
      isDMBased: vi.fn(() => false),
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

  // 同じリポジトリ定例は同一インスタンスを返し、別のリポジトリを渡すと新たなインスタンスが生成されることを検証
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
