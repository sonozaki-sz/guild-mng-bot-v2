import type { Mock, Mocked } from "vitest";
import { sendVacControlPanel } from "@/bot/features/vac/handlers/ui/vacControlPanel";
import type { IVacRepository } from "@/bot/features/vac/repositories/vacRepository";
import { handleVacCreateUseCase } from "@/bot/features/vac/services/usecases/handleVacCreate";
import { ChannelType, PermissionFlagsBits } from "discord.js";

const loggerInfoMock = vi.fn();
const loggerWarnMock = vi.fn();
const loggerErrorMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: vi.fn((key: string) => `default:${key}`),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfoMock(...args),
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}));

vi.mock("@/bot/features/vac/handlers/ui/vacControlPanel", () => ({
  sendVacControlPanel: vi.fn(),
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

function createVoiceStateInput(options?: {
  displayName?: string;
  triggerChannelId?: string;
  parentCategoryChildrenCount?: number;
  channelNames?: string[];
  createdChannel?: { id: string; type: ChannelType };
}) {
  const setChannelMock = vi.fn().mockResolvedValue(undefined);
  const fetchMock = vi.fn();
  const createMock = vi.fn().mockResolvedValue(
    options?.createdChannel ?? {
      id: "created-voice-1",
      type: ChannelType.GuildVoice,
    },
  );

  const names = options?.channelNames ?? [];
  const channelsCache = {
    find: (predicate: (channel: { name: string }) => boolean) =>
      names.map((name) => ({ name })).find(predicate),
  };

  const member = {
    id: "user-1",
    displayName: options?.displayName ?? "Alice",
    guild: {
      id: "guild-1",
      channels: {
        fetch: fetchMock,
        create: createMock,
        cache: channelsCache,
      },
    },
    voice: {
      setChannel: setChannelMock,
    },
  };

  const parent =
    typeof options?.parentCategoryChildrenCount === "number"
      ? {
          id: "category-1",
          type: ChannelType.GuildCategory,
          children: {
            cache: {
              size: options.parentCategoryChildrenCount,
            },
          },
        }
      : null;

  const newChannel = {
    id: options?.triggerChannelId ?? "trigger-1",
    type: ChannelType.GuildVoice,
    parent,
  };

  const newState = {
    member,
    channel: newChannel,
  };

  return {
    newState,
    member,
    fetchMock,
    createMock,
    setChannelMock,
  };
}

describe("bot/features/vac/services/usecases/handleVacCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    (sendVacControlPanel as Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns when member or channel is missing, or channel is not voice", async () => {
    const repository = createRepositoryMock();

    await handleVacCreateUseCase(repository, { member: null } as never);
    await handleVacCreateUseCase(repository, {
      member: { id: "user-1" },
      channel: null,
    } as never);
    await handleVacCreateUseCase(repository, {
      member: { id: "user-1" },
      channel: { type: ChannelType.GuildText },
    } as never);

    expect(repository.getVacConfigOrDefault).not.toHaveBeenCalled();
  });

  it("returns when VAC is disabled or joined channel is not trigger", async () => {
    const repository = createRepositoryMock();
    const { newState } = createVoiceStateInput({
      triggerChannelId: "trigger-1",
    });

    repository.getVacConfigOrDefault.mockResolvedValueOnce({
      enabled: false,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    });
    await handleVacCreateUseCase(repository, newState as never);

    repository.getVacConfigOrDefault.mockResolvedValueOnce({
      enabled: true,
      triggerChannelIds: ["trigger-2"],
      createdChannels: [],
    });
    await handleVacCreateUseCase(repository, newState as never);

    expect(repository.addCreatedVacChannel).not.toHaveBeenCalled();
  });

  it("moves user to existing owned managed channel and skips creation", async () => {
    const repository = createRepositoryMock();
    const { newState, fetchMock, createMock, setChannelMock } =
      createVoiceStateInput();

    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [
        {
          voiceChannelId: "owned-1",
          ownerId: "user-1",
          createdAt: 1,
        },
      ],
    });
    const ownedChannel = { id: "owned-1", type: ChannelType.GuildVoice };
    fetchMock.mockResolvedValue(ownedChannel);

    await handleVacCreateUseCase(repository, newState as never);

    expect(fetchMock).toHaveBeenCalledWith("owned-1");
    expect(setChannelMock).toHaveBeenCalledWith(ownedChannel);
    expect(createMock).not.toHaveBeenCalled();
    expect(repository.removeCreatedVacChannel).not.toHaveBeenCalled();
  });

  it("removes stale owned channel record when existing owned channel is unavailable", async () => {
    const repository = createRepositoryMock();
    const { newState, fetchMock } = createVoiceStateInput();

    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [
        {
          voiceChannelId: "owned-1",
          ownerId: "user-1",
          createdAt: 1,
        },
      ],
    });
    fetchMock.mockRejectedValue(new Error("not found"));

    await handleVacCreateUseCase(repository, newState as never);

    expect(repository.removeCreatedVacChannel).toHaveBeenCalledWith(
      "guild-1",
      "owned-1",
    );
  });

  it("returns when parent category reached channel limit", async () => {
    const repository = createRepositoryMock();
    const { newState, createMock } = createVoiceStateInput({
      parentCategoryChildrenCount: 50,
    });

    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    });

    await handleVacCreateUseCase(repository, newState as never);

    expect(createMock).not.toHaveBeenCalled();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
  });

  it("creates managed voice channel, sends panel, moves user, and stores record", async () => {
    const repository = createRepositoryMock();
    const { newState, createMock, setChannelMock } = createVoiceStateInput({
      displayName: "Alice",
      channelNames: ["Alice's Room"],
    });

    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    });

    await handleVacCreateUseCase(repository, newState as never);

    expect(createMock).toHaveBeenCalledWith({
      name: "Alice's Room (2)",
      type: ChannelType.GuildVoice,
      parent: null,
      userLimit: 99,
      permissionOverwrites: [
        {
          id: "user-1",
          allow: [PermissionFlagsBits.ManageChannels],
        },
      ],
    });
    expect(sendVacControlPanel).toHaveBeenCalledTimes(1);
    expect(setChannelMock).toHaveBeenCalledWith({
      id: "created-voice-1",
      type: ChannelType.GuildVoice,
    });
    expect(repository.addCreatedVacChannel).toHaveBeenCalledWith("guild-1", {
      voiceChannelId: "created-voice-1",
      ownerId: "user-1",
      createdAt: 1700000000000,
    });
    expect(loggerInfoMock).toHaveBeenCalledTimes(1);
  });

  it("returns early when created channel is not a voice channel", async () => {
    const repository = createRepositoryMock();
    const { newState, createMock, setChannelMock } = createVoiceStateInput({
      createdChannel: {
        id: "created-text-1",
        type: ChannelType.GuildText,
      },
    });

    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    });

    await handleVacCreateUseCase(repository, newState as never);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(sendVacControlPanel).not.toHaveBeenCalled();
    expect(setChannelMock).not.toHaveBeenCalled();
    expect(repository.addCreatedVacChannel).not.toHaveBeenCalled();
  });

  it("logs panel send failure and still continues move + save", async () => {
    const repository = createRepositoryMock();
    const { newState, setChannelMock } = createVoiceStateInput();
    repository.getVacConfigOrDefault.mockResolvedValue({
      enabled: true,
      triggerChannelIds: ["trigger-1"],
      createdChannels: [],
    });
    (sendVacControlPanel as Mock).mockRejectedValueOnce(
      new Error("panel failed"),
    );

    await handleVacCreateUseCase(repository, newState as never);

    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    expect(setChannelMock).toHaveBeenCalledTimes(1);
    expect(repository.addCreatedVacChannel).toHaveBeenCalledTimes(1);
  });
});
