// tests/unit/shared/locale/helpers.test.ts
import {
  getGuildTranslator,
  invalidateGuildLocaleCache,
} from "@/shared/locale/helpers";

const getGuildTMock = vi.fn();
const invalidateLocaleCacheMock = vi.fn();

vi.mock("@/shared/locale/localeManager", () => ({
  localeManager: {
    getGuildT: (...args: unknown[]) => getGuildTMock(...args),
    invalidateLocaleCache: (...args: unknown[]) =>
      invalidateLocaleCacheMock(...args),
  },
}));

// locale helper の dynamic import 経路とキャッシュ無効化呼び出しを検証
describe("shared/locale/helpers", () => {
  // 各ケースでモック呼び出し履歴を独立化する
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // guild translator 取得時に localeManager.getGuildT を透過利用することを検証
  it("returns guild translator from locale manager", async () => {
    const fixedT = vi.fn((key: string) => `translated:${key}`);
    getGuildTMock.mockResolvedValue(fixedT);

    const translator = await getGuildTranslator("guild-1");

    expect(getGuildTMock).toHaveBeenCalledWith("guild-1");
    expect(translator("system:bot.starting" as never)).toBe(
      "translated:system:bot.starting",
    );
  });

  // 追加パラメータなしで guild translator を解決できることを検証
  it("resolves translator without repository parameter", async () => {
    const fixedT = vi.fn((key: string) => key);
    getGuildTMock.mockResolvedValue(fixedT);

    await getGuildTranslator("guild-2");

    expect(getGuildTMock).toHaveBeenCalledWith("guild-2");
  });

  // 明示的なキャッシュ無効化が対象 guildId に対して実行されることを検証
  it("invalidates locale cache for target guild", async () => {
    await invalidateGuildLocaleCache("guild-3");

    expect(invalidateLocaleCacheMock).toHaveBeenCalledWith("guild-3");
  });
});
