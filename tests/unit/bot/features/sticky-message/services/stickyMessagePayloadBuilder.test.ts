// tests/unit/bot/features/sticky-message/services/stickyMessagePayloadBuilder.test.ts

import {
  buildStickyMessagePayload,
  parseColorStr,
} from "@/bot/features/sticky-message/services/stickyMessagePayloadBuilder";
import { EmbedBuilder } from "discord.js";

function makeSticky(
  overrides: Partial<{
    content: string;
    embedData: string | null;
    id: string;
    guildId: string;
    channelId: string;
    lastMessageId: string | null;
    updatedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: "sticky-1",
    guildId: "guild-1",
    channelId: "channel-1",
    content: "Hello World",
    embedData: null,
    lastMessageId: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// スティッキーメッセージの設定データからDiscord送信ペイロードを構築するロジックと
// 色文字列パースのエッジケースを網羅的に検証するグループ
describe("bot/features/sticky-message/services/stickyMessagePayloadBuilder", () => {
  // embedData の有無・有効性によって content ペイロードと embed ペイロードを切り替える動作を検証
  describe("buildStickyMessagePayload", () => {
    it("returns content payload when embedData is null", () => {
      const sticky = makeSticky({
        content: "Plain text message",
        embedData: null,
      });
      const payload = buildStickyMessagePayload(sticky);

      expect(payload).toEqual({ content: "Plain text message" });
    });

    it("returns embed payload when embedData is a valid JSON", () => {
      const embedData = JSON.stringify({
        title: "My Title",
        description: "My Description",
        color: 0xff0000,
      });
      const sticky = makeSticky({ content: "fallback", embedData });
      const payload = buildStickyMessagePayload(sticky);

      expect(payload.embeds).toBeDefined();
      expect(payload.embeds).toHaveLength(1);
      expect(payload.embeds![0]).toBeInstanceOf(EmbedBuilder);
    });

    // embedData に description がない場合、content フィールドを embed の description として代替使用することを確認
    it("uses fallback content description when embedData has no description", () => {
      const embedData = JSON.stringify({ title: "Only Title" });
      const sticky = makeSticky({ content: "Fallback content", embedData });
      const payload = buildStickyMessagePayload(sticky);

      expect(payload.embeds).toBeDefined();
      expect(payload.embeds).toHaveLength(1);
      const embed = (payload.embeds![0] as EmbedBuilder).toJSON();
      expect(embed.description).toBe("Fallback content");
    });

    it("uses default color when embedData has no color", () => {
      const embedData = JSON.stringify({ description: "desc" });
      const sticky = makeSticky({ embedData });
      const payload = buildStickyMessagePayload(sticky);

      expect(payload.embeds).toBeDefined();
      const embed = (payload.embeds![0] as EmbedBuilder).toJSON();
      expect(embed.color).toBe(0x008969);
    });

    // embedData が壊れた JSON でも例外を上げず、content をフォールバックとして embed を生成することを確認
    it("falls back to plain embed on invalid JSON embedData", () => {
      const sticky = makeSticky({
        content: "Fallback",
        embedData: "not-json{",
      });
      const payload = buildStickyMessagePayload(sticky);

      expect(payload.embeds).toBeDefined();
      const embed = (payload.embeds![0] as EmbedBuilder).toJSON();
      expect(embed.description).toBe("Fallback");
      expect(embed.color).toBe(0x008969);
    });
  });

  // #RRGGBB・0xRRGGBB・プレフィックスなし HEX など複数フォーマットと、無効値でのデフォルト返却を検証
  describe("parseColorStr", () => {
    it("returns default color for null input", () => {
      expect(parseColorStr(null)).toBe(0x008969);
    });

    it("returns default color for undefined input", () => {
      expect(parseColorStr(undefined)).toBe(0x008969);
    });

    it("returns default color for empty string", () => {
      expect(parseColorStr("")).toBe(0x008969);
    });

    it("parses #RRGGBB format", () => {
      expect(parseColorStr("#ff0000")).toBe(0xff0000);
    });

    it("parses 0xRRGGBB format", () => {
      expect(parseColorStr("0x00ff00")).toBe(0x00ff00);
    });

    it("parses 0XRRGGBB format (uppercase X)", () => {
      expect(parseColorStr("0X0000ff")).toBe(0x0000ff);
    });

    it("parses plain RRGGBB hex without prefix", () => {
      expect(parseColorStr("123456")).toBe(0x123456);
    });

    // 解釈不能な文字列を渡した場合にデフォルト色にフォールバックすることを確認（サイレント耐障害性）
    it("returns default color on invalid hex string", () => {
      expect(parseColorStr("gggggg")).toBe(0x008969);
    });
  });
});
