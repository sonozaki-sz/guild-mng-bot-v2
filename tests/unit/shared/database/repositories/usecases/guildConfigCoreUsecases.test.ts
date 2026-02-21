import {
  existsGuildConfigRecord,
  findGuildConfigRecord,
  findGuildLocale,
} from "@/shared/database/repositories/persistence/guildConfigReadPersistence";
import {
  createGuildConfigRecord,
  deleteGuildConfigRecord,
  upsertGuildConfigRecord,
} from "@/shared/database/repositories/persistence/guildConfigWritePersistence";
import {
  toGuildConfig,
  toGuildConfigCreateData,
  toGuildConfigUpdateData,
} from "@/shared/database/repositories/serializers/guildConfigSerializer";
import {
  deleteGuildConfigUsecase,
  existsGuildConfigUsecase,
  getGuildConfigUsecase,
  getGuildLocaleUsecase,
  saveGuildConfigUsecase,
  updateGuildConfigUsecase,
  updateGuildLocaleUsecase,
} from "@/shared/database/repositories/usecases/guildConfigCoreUsecases";

jest.mock(
  "@/shared/database/repositories/persistence/guildConfigReadPersistence",
  () => ({
    existsGuildConfigRecord: jest.fn(),
    findGuildConfigRecord: jest.fn(),
    findGuildLocale: jest.fn(),
  }),
);

jest.mock(
  "@/shared/database/repositories/persistence/guildConfigWritePersistence",
  () => ({
    createGuildConfigRecord: jest.fn(),
    deleteGuildConfigRecord: jest.fn(),
    upsertGuildConfigRecord: jest.fn(),
  }),
);

jest.mock(
  "@/shared/database/repositories/serializers/guildConfigSerializer",
  () => ({
    toGuildConfig: jest.fn(),
    toGuildConfigCreateData: jest.fn(),
    toGuildConfigUpdateData: jest.fn(),
  }),
);

describe("shared/database/repositories/usecases/guildConfigCoreUsecases", () => {
  const deps = {
    prisma: { guildConfig: {} } as never,
    defaultLocale: "ja",
    toDatabaseError: jest.fn(
      (prefix: string, error: unknown) =>
        new Error(
          `${prefix}:${error instanceof Error ? error.message : String(error)}`,
        ),
    ),
  };

  const findGuildConfigRecordMock =
    findGuildConfigRecord as jest.MockedFunction<typeof findGuildConfigRecord>;
  const toGuildConfigMock = toGuildConfig as jest.MockedFunction<
    typeof toGuildConfig
  >;
  const toCreateDataMock = toGuildConfigCreateData as jest.MockedFunction<
    typeof toGuildConfigCreateData
  >;
  const createGuildConfigRecordMock =
    createGuildConfigRecord as jest.MockedFunction<
      typeof createGuildConfigRecord
    >;
  const toUpdateDataMock = toGuildConfigUpdateData as jest.MockedFunction<
    typeof toGuildConfigUpdateData
  >;
  const upsertGuildConfigRecordMock =
    upsertGuildConfigRecord as jest.MockedFunction<
      typeof upsertGuildConfigRecord
    >;
  const deleteGuildConfigRecordMock =
    deleteGuildConfigRecord as jest.MockedFunction<
      typeof deleteGuildConfigRecord
    >;
  const existsGuildConfigRecordMock =
    existsGuildConfigRecord as jest.MockedFunction<
      typeof existsGuildConfigRecord
    >;
  const findGuildLocaleMock = findGuildLocale as jest.MockedFunction<
    typeof findGuildLocale
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getGuildConfigUsecase returns mapped config or null", async () => {
    findGuildConfigRecordMock.mockResolvedValueOnce({ guildId: "g1" } as never);
    toGuildConfigMock.mockReturnValueOnce({
      guildId: "g1",
      locale: "ja",
    } as never);

    await expect(getGuildConfigUsecase(deps, "g1")).resolves.toEqual({
      guildId: "g1",
      locale: "ja",
    });
    expect(toGuildConfigMock).toHaveBeenCalled();

    findGuildConfigRecordMock.mockResolvedValueOnce(null);
    await expect(getGuildConfigUsecase(deps, "g2")).resolves.toBeNull();
  });

  it("getGuildConfigUsecase wraps errors with toDatabaseError", async () => {
    findGuildConfigRecordMock.mockRejectedValueOnce(new Error("db down"));

    await expect(getGuildConfigUsecase(deps, "g1")).rejects.toThrow(
      "Failed to get guild config:db down",
    );
    expect(deps.toDatabaseError).toHaveBeenCalled();
  });

  it("saveGuildConfigUsecase serializes and persists create data", async () => {
    const config = { guildId: "g1", locale: "ja" } as never;
    const createData = { guildId: "g1", locale: "ja" } as never;
    toCreateDataMock.mockReturnValueOnce(createData);

    await saveGuildConfigUsecase(deps, config);
    expect(toCreateDataMock).toHaveBeenCalledWith(config, "ja");
    expect(createGuildConfigRecordMock).toHaveBeenCalledWith(
      deps.prisma,
      createData,
    );
  });

  it("updateGuildConfigUsecase builds upsert payload and wraps failures", async () => {
    toUpdateDataMock.mockReturnValueOnce({ afkConfig: "{}" });

    await updateGuildConfigUsecase(deps, "g1", { locale: "en" } as never);
    expect(upsertGuildConfigRecordMock).toHaveBeenCalledWith(
      deps.prisma,
      "g1",
      { afkConfig: "{}" },
      { guildId: "g1", locale: "en", afkConfig: "{}" },
    );

    upsertGuildConfigRecordMock.mockRejectedValueOnce(new Error("conflict"));
    await expect(
      updateGuildConfigUsecase(deps, "g1", {} as never),
    ).rejects.toThrow("Failed to update guild config:conflict");
  });

  it("delete/exists usecases delegate and wrap failures", async () => {
    await deleteGuildConfigUsecase(deps, "g1");
    expect(deleteGuildConfigRecordMock).toHaveBeenCalledWith(deps.prisma, "g1");

    deleteGuildConfigRecordMock.mockRejectedValueOnce(new Error("delete err"));
    await expect(deleteGuildConfigUsecase(deps, "g1")).rejects.toThrow(
      "Failed to delete guild config:delete err",
    );

    existsGuildConfigRecordMock.mockResolvedValueOnce(true);
    await expect(existsGuildConfigUsecase(deps, "g1")).resolves.toBe(true);

    existsGuildConfigRecordMock.mockRejectedValueOnce(new Error("exists err"));
    await expect(existsGuildConfigUsecase(deps, "g1")).rejects.toThrow(
      "Failed to check guild config existence:exists err",
    );
  });

  it("getGuildLocaleUsecase returns locale, fallback, and fallback-on-error", async () => {
    findGuildLocaleMock.mockResolvedValueOnce("en");
    await expect(getGuildLocaleUsecase(deps, "g1")).resolves.toBe("en");

    findGuildLocaleMock.mockResolvedValueOnce(null);
    await expect(getGuildLocaleUsecase(deps, "g1")).resolves.toBe("ja");

    findGuildLocaleMock.mockRejectedValueOnce(new Error("locale err"));
    await expect(getGuildLocaleUsecase(deps, "g1")).resolves.toBe("ja");
  });

  it("updateGuildLocaleUsecase delegates through updateGuildConfigUsecase", async () => {
    toUpdateDataMock.mockReturnValueOnce({ locale: "en" });
    await updateGuildLocaleUsecase(deps, "g1", "en");

    expect(upsertGuildConfigRecordMock).toHaveBeenCalledWith(
      deps.prisma,
      "g1",
      { locale: "en" },
      { guildId: "g1", locale: "en" },
    );
  });
});
