// tests/unit/shared/database/repositories/serializers/guildConfigSerializer.test.ts
import {
  parseJsonSafe,
  toGuildConfig,
  toGuildConfigCreateData,
  toGuildConfigUpdateData,
} from "@/shared/database/repositories/serializers/guildConfigSerializer";

// DBレコード ↔ ドメインオブジェクト間のJSONシリアライズ・デシリアライズ変換ロジックを検証する
describe("shared/database/repositories/serializers/guildConfigSerializer", () => {
  it("parseJsonSafe returns parsed value and undefined for null/invalid json", () => {
    expect(parseJsonSafe<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonSafe("" as unknown as string | null)).toBeUndefined();
    expect(parseJsonSafe("not-json")).toBeUndefined();
    expect(parseJsonSafe(null)).toBeUndefined();
  });

  it("toGuildConfig maps record and safely parses nested json fields", () => {
    const record = {
      id: "id-1",
      guildId: "guild-1",
      locale: "ja",
      afkConfig: '{"enabled":true,"channelId":"afk"}',
      vacConfig: '{"enabled":true,"triggerChannelIds":[],"createdChannels":[]}',
      bumpReminderConfig:
        '{"enabled":false,"mentionUserIds":["u1"],"channelId":"c1"}',
      stickMessages: '[{"channelId":"ch1","messageId":"m1"}]',
      memberLogConfig: '{"channelId":"log"}',
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    };

    expect(toGuildConfig(record)).toEqual({
      guildId: "guild-1",
      locale: "ja",
      afkConfig: { enabled: true, channelId: "afk" },
      vacConfig: { enabled: true, triggerChannelIds: [], createdChannels: [] },
      bumpReminderConfig: {
        enabled: false,
        mentionUserIds: ["u1"],
        channelId: "c1",
      },
      stickMessages: [{ channelId: "ch1", messageId: "m1" }],
      memberLogConfig: { channelId: "log" },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  });

  // 不正なJSON文字列やnullフィールドが破壊的エラーにならずundefinedへフォールバックすることを確認
  it("toGuildConfig falls back to undefined for invalid JSON fields", () => {
    const record = {
      id: "id-2",
      guildId: "guild-2",
      locale: "en",
      afkConfig: "invalid",
      vacConfig: null,
      bumpReminderConfig: "invalid",
      stickMessages: null,
      memberLogConfig: "invalid",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    };

    const mapped = toGuildConfig(record);
    expect(mapped.afkConfig).toBeUndefined();
    expect(mapped.vacConfig).toBeUndefined();
    expect(mapped.bumpReminderConfig).toBeUndefined();
    expect(mapped.stickMessages).toBeUndefined();
    expect(mapped.memberLogConfig).toBeUndefined();
  });

  // localeが空の場合はデフォルト値で補完され、各フィールドがJSON文字列化されundefinedはnullに変換されることを確認
  it("toGuildConfigCreateData serializes values and applies default locale", () => {
    const data = toGuildConfigCreateData(
      {
        guildId: "guild-3",
        locale: "",
        afkConfig: { enabled: false },
        vacConfig: undefined,
        bumpReminderConfig: { enabled: true, mentionUserIds: [] },
        stickMessages: [],
        memberLogConfig: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      "ja",
    );

    expect(data).toEqual({
      guildId: "guild-3",
      locale: "ja",
      afkConfig: '{"enabled":false}',
      vacConfig: null,
      bumpReminderConfig: '{"enabled":true,"mentionUserIds":[]}',
      stickMessages: "[]",
      memberLogConfig: null,
    });
  });

  it("toGuildConfigUpdateData includes only provided fields as JSON", () => {
    const result = toGuildConfigUpdateData({
      locale: "en",
      afkConfig: { enabled: true, channelId: "x" },
      vacConfig: {
        enabled: true,
        triggerChannelIds: ["t"],
        createdChannels: [],
      },
      bumpReminderConfig: { enabled: false, mentionUserIds: ["u"] },
      stickMessages: [{ channelId: "c", messageId: "m" }],
      memberLogConfig: { enabled: true, channelId: "log" },
    });

    expect(result).toEqual({
      locale: "en",
      afkConfig: '{"enabled":true,"channelId":"x"}',
      vacConfig:
        '{"enabled":true,"triggerChannelIds":["t"],"createdChannels":[]}',
      bumpReminderConfig: '{"enabled":false,"mentionUserIds":["u"]}',
      stickMessages: '[{"channelId":"c","messageId":"m"}]',
      memberLogConfig: '{"enabled":true,"channelId":"log"}',
    });
  });

  // フィールドを一切渡さない場合は空オブジェクトが返り、余分なキーが混入しないことを確認
  it("toGuildConfigUpdateData returns empty object when no fields are provided", () => {
    expect(toGuildConfigUpdateData({})).toEqual({});
  });
});
