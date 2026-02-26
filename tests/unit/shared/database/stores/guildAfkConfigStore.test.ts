// tests/unit/shared/database/stores/guildAfkConfigStore.test.ts
import { GuildAfkConfigStore } from "@/shared/database/stores/guildAfkConfigStore";
import {
  casUpdateAfkConfig,
  fetchAfkConfigSnapshot,
  initializeAfkConfigIfMissing,
} from "@/shared/database/stores/helpers/afkConfigCas";
import { DatabaseError } from "@/shared/errors/customErrors";
import type { MockedFunction } from "vitest";

vi.mock("@/shared/database/stores/helpers/afkConfigCas", () => ({
  AFK_CONFIG_CAS_MAX_RETRIES: 3,
  fetchAfkConfigSnapshot: vi.fn(),
  initializeAfkConfigIfMissing: vi.fn(),
  casUpdateAfkConfig: vi.fn(),
}));

// CAS（Compare-and-Swap）パターンを用いたAFK設定の楽観的ロック更新と、初期化・スキップ・競合リトライ各ブランチを検証する
describe("shared/database/stores/guildAfkConfigStore", () => {
  const fetchSnapshotMock = fetchAfkConfigSnapshot as MockedFunction<
    typeof fetchAfkConfigSnapshot
  >;
  const initializeIfMissingMock =
    initializeAfkConfigIfMissing as MockedFunction<
      typeof initializeAfkConfigIfMissing
    >;
  const casUpdateMock = casUpdateAfkConfig as MockedFunction<
    typeof casUpdateAfkConfig
  >;

  const createStore = () => {
    const prisma = {
      guildConfig: {
        findUnique: vi.fn(),
      },
    };
    const safeJsonParse = vi.fn();

    const store = new GuildAfkConfigStore(prisma as never, "ja", safeJsonParse);
    return { store, prisma, safeJsonParse };
  };

  // 各テストでモック呼び出し状態をリセットし、前のテストのスナップショットやCAS結果が漏れないようにする
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAfkConfig returns parsed config or null", async () => {
    const { store, prisma, safeJsonParse } = createStore();
    prisma.guildConfig.findUnique.mockResolvedValueOnce({ afkConfig: "{}" });
    safeJsonParse.mockReturnValueOnce({ enabled: true });

    await expect(store.getAfkConfig("g1")).resolves.toEqual({ enabled: true });
    expect(prisma.guildConfig.findUnique).toHaveBeenCalledWith({
      where: { guildId: "g1" },
      select: { afkConfig: true },
    });

    prisma.guildConfig.findUnique.mockResolvedValueOnce(null);
    safeJsonParse.mockReturnValueOnce(undefined);
    await expect(store.getAfkConfig("g2")).resolves.toBeNull();
  });

  it("setAfkChannel delegates to updateAfkConfig with enabled=true", async () => {
    const { store } = createStore();
    const spy = vi.spyOn(store, "updateAfkConfig").mockResolvedValue(undefined);

    await store.setAfkChannel("g1", "channel-1");
    expect(spy).toHaveBeenCalledWith("g1", {
      enabled: true,
      channelId: "channel-1",
    });
  });

  it("updateAfkConfig initializes when config is missing", async () => {
    const { store, safeJsonParse } = createStore();
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: false,
      rawConfig: null,
    });
    safeJsonParse.mockReturnValueOnce(undefined);
    initializeIfMissingMock.mockResolvedValueOnce(true);

    await expect(
      store.updateAfkConfig("g1", { enabled: true, channelId: "x" }),
    ).resolves.toBeUndefined();

    expect(initializeIfMissingMock).toHaveBeenCalledWith(
      expect.anything(),
      "g1",
      "ja",
      JSON.stringify({ enabled: true, channelId: "x" }),
      false,
    );
  });

  // マージ後の設定が現在値と完全一致する場合、無駄なCAS更新を実行しないことを確認する
  it("updateAfkConfig returns early when merged config does not change", async () => {
    const { store, safeJsonParse } = createStore();
    const raw = '{"enabled":true,"channelId":"x"}';
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: true,
      rawConfig: raw,
    });
    safeJsonParse.mockReturnValueOnce({ enabled: true, channelId: "x" });

    await expect(
      store.updateAfkConfig("g1", { enabled: true, channelId: "x" }),
    ).resolves.toBeUndefined();
    expect(casUpdateMock).not.toHaveBeenCalled();
  });

  it("updateAfkConfig performs CAS update and succeeds", async () => {
    const { store, safeJsonParse } = createStore();
    const raw = '{"enabled":false,"channelId":"x"}';
    fetchSnapshotMock.mockResolvedValueOnce({
      recordExists: true,
      rawConfig: raw,
    });
    safeJsonParse.mockReturnValueOnce({ enabled: false, channelId: "x" });
    casUpdateMock.mockResolvedValueOnce(true);

    await expect(
      store.updateAfkConfig("g1", { enabled: true }),
    ).resolves.toBeUndefined();
    expect(casUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      "g1",
      raw,
      '{"enabled":true,"channelId":"x"}',
    );
  });

  // 初期化試行で他プロセスが先に作成済み（false返却）の場合、スナップショットを再取得してCAS更新にフォールスルーすることを確認する
  it("updateAfkConfig continues when initialize returns false, then updates", async () => {
    const { store, safeJsonParse } = createStore();
    const raw = '{"enabled":false,"channelId":"x"}';
    fetchSnapshotMock
      .mockResolvedValueOnce({
        recordExists: false,
        rawConfig: null,
      })
      .mockResolvedValueOnce({
        recordExists: true,
        rawConfig: raw,
      });
    safeJsonParse.mockReturnValueOnce(undefined).mockReturnValueOnce({
      enabled: false,
      channelId: "x",
    });
    initializeIfMissingMock.mockResolvedValueOnce(false);
    casUpdateMock.mockResolvedValueOnce(true);

    await expect(
      store.updateAfkConfig("g1", { enabled: true }),
    ).resolves.toBeUndefined();

    expect(initializeIfMissingMock).toHaveBeenCalledTimes(1);
    expect(casUpdateMock).toHaveBeenCalledTimes(1);
    expect(casUpdateMock).toHaveBeenCalledWith(
      expect.anything(),
      "g1",
      raw,
      '{"enabled":true,"channelId":"x"}',
    );
  });

  // CASが最大リトライ回数を超えても競合が解消しない場合にDatabaseErrorが投げられることを確認する
  it("updateAfkConfig throws DatabaseError when conflicts persist", async () => {
    const { store, safeJsonParse } = createStore();
    const raw = '{"enabled":false}';
    fetchSnapshotMock.mockResolvedValue({ recordExists: true, rawConfig: raw });
    safeJsonParse.mockReturnValue({ enabled: false });
    casUpdateMock.mockResolvedValue(false);

    await expect(
      store.updateAfkConfig("g1", { enabled: true }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});
