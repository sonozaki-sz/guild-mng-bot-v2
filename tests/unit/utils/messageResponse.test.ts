// tests/unit/utils/messageResponse.test.ts
// メッセージレスポンスユーティリティのテスト

import { EmbedBuilder } from "discord.js";
import {
  MessageStatus,
  createErrorEmbed,
  createInfoEmbed,
  createStatusEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../src/bot/utils/messageResponse";
import { localeManager } from "../../../src/shared/locale";

// i18n 依存のタイトル検証に備えてロケールを初期化
beforeAll(async () => {
  await localeManager.initialize();
});

describe("messageResponse", () => {
  // ステータス別Embed生成とオプション反映の挙動を検証
  describe("createStatusEmbed", () => {
    it.each<[MessageStatus, number, string]>([
      ["success", 0x57f287, "✅"],
      ["info", 0x3498db, "ℹ️"],
      ["warning", 0xfee75c, "⚠️"],
      ["error", 0xed4245, "❌"],
    ])(
      "should create embed with correct color and emoji for %s status",
      (status, expectedColor, expectedEmoji) => {
        const title = "Test Title";
        const description = "Test Description";

        const embed = createStatusEmbed(status, title, description);

        expect(embed).toBeInstanceOf(EmbedBuilder);
        expect(embed.data.color).toBe(expectedColor);
        expect(embed.data.title).toBe(`${expectedEmoji} ${title}`);
        expect(embed.data.description).toBe(description);
      },
    );

    it("should add timestamp when timestamp option is true", () => {
      // timestamp オプション有効時は埋め込みに時刻が付与される
      const embed = createStatusEmbed("info", "Title", "Description", {
        timestamp: true,
      });

      expect(embed.data.timestamp).toBeDefined();
    });

    it("should not add timestamp when timestamp option is false or undefined", () => {
      // false/未指定時は timestamp を付与しない
      const embed1 = createStatusEmbed("info", "Title", "Description", {
        timestamp: false,
      });
      const embed2 = createStatusEmbed("info", "Title", "Description");

      expect(embed1.data.timestamp).toBeUndefined();
      expect(embed2.data.timestamp).toBeUndefined();
    });

    it("should add fields when fields option is provided", () => {
      // fields オプションで任意フィールドが反映されること
      const fields = [
        { name: "Field 1", value: "Value 1", inline: true },
        { name: "Field 2", value: "Value 2", inline: false },
      ];

      const embed = createStatusEmbed("info", "Title", "Description", {
        fields,
      });

      expect(embed.data.fields).toHaveLength(2);
      expect(embed.data.fields?.[0]).toMatchObject({
        name: "Field 1",
        value: "Value 1",
        inline: true,
      });
      expect(embed.data.fields?.[1]).toMatchObject({
        name: "Field 2",
        value: "Value 2",
        inline: false,
      });
    });

    it("should truncate title if it exceeds 256 characters", () => {
      const longTitle = "a".repeat(260);
      const embed = createStatusEmbed("info", longTitle, "Description");

      expect(embed.data.title?.length).toBeLessThanOrEqual(256);
      expect(embed.data.title).toContain("...");
    });
  });

  describe("createSuccessEmbed", () => {
    it("should create success embed with correct color and locale title", () => {
      const embed = createSuccessEmbed("Operation completed");

      expect(embed.data.color).toBe(0x57f287);
      // タイトルはロケール設定から取得（デフォルト: ja → "成功"）
      expect(embed.data.title).toBe("✅ 成功");
      expect(embed.data.description).toBe("Operation completed");
    });

    it("should support options", () => {
      const embed = createSuccessEmbed("Description", {
        timestamp: true,
      });

      expect(embed.data.timestamp).toBeDefined();
    });
  });

  describe("createInfoEmbed", () => {
    it("should create info embed with default title", () => {
      const embed = createInfoEmbed("Information message");

      expect(embed.data.color).toBe(0x3498db);
      expect(embed.data.title).toBe("ℹ️ 情報");
      expect(embed.data.description).toBe("Information message");
    });

    it("should use custom title when provided via options", () => {
      const embed = createInfoEmbed("Information message", { title: "Custom" });

      expect(embed.data.title).toBe("ℹ️ Custom");
    });

    it("should support options with fields", () => {
      // ラッパー関数経由でも fields 指定が維持されること
      const fields = [{ name: "Status", value: "Active", inline: true }];
      const embed = createInfoEmbed("Description", { fields });

      expect(embed.data.fields).toHaveLength(1);
      expect(embed.data.fields?.[0].name).toBe("Status");
    });
  });

  describe("createWarningEmbed", () => {
    it("should create warning embed with default title", () => {
      const embed = createWarningEmbed("Please be careful");

      expect(embed.data.color).toBe(0xfee75c);
      expect(embed.data.title).toBe("⚠️ 警告");
      expect(embed.data.description).toBe("Please be careful");
    });

    it("should use custom title when provided via options", () => {
      const embed = createWarningEmbed("Please be careful", {
        title: "Custom Warning",
      });

      expect(embed.data.title).toBe("⚠️ Custom Warning");
    });
  });

  describe("createErrorEmbed", () => {
    it("should create error embed with default title", () => {
      const embed = createErrorEmbed("An error occurred");

      expect(embed.data.color).toBe(0xed4245);
      expect(embed.data.title).toBe("❌ エラー");
      expect(embed.data.description).toBe("An error occurred");
    });

    it("should use custom title when provided via options", () => {
      const embed = createErrorEmbed("An error occurred", {
        title: "Permission Error",
      });

      expect(embed.data.title).toBe("❌ Permission Error");
    });
  });
});
