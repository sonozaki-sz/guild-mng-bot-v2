// tests/unit/bot/features/message-delete/commands/messageDeleteEmbedBuilder.test.ts

import type { DeletedMessageRecord } from "@/bot/features/message-delete/constants/messageDeleteConstants";
import { MSG_DEL_CUSTOM_ID } from "@/bot/features/message-delete/constants/messageDeleteConstants";
import { ButtonStyle } from "discord.js";

const tDefaultMock = vi.fn((key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key,
);

vi.mock("@/shared/locale/localeManager", () => ({
  tDefault: (key: string, opts?: Record<string, unknown>) =>
    tDefaultMock(key, opts),
}));

// ──────────────────────────────────────
// テスト共通ヘルパー
// ──────────────────────────────────────

function makeRecord(
  overrides: Partial<DeletedMessageRecord> = {},
): DeletedMessageRecord {
  return {
    authorId: overrides.authorId ?? "u1",
    authorTag: overrides.authorTag ?? "user#0001",
    channelId: overrides.channelId ?? "ch-1",
    channelName: overrides.channelName ?? "general",
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00Z"),
    content: overrides.content ?? "hello",
  };
}

// ──────────────────────────────────────
// テスト本体
// ──────────────────────────────────────

// buildSummaryEmbed / buildFilteredRecords / buildDetailEmbed / buildPaginationComponents の
// レイアウト・フィルタロジック・コンポーネント状態を検証
describe("bot/features/message-delete/commands/messageDeleteEmbedBuilder", () => {
  // 各ケースで tDefault モックの呼び出し記録をリセットする
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // buildSummaryEmbed の色・タイトル・フィールド構造を検証
  describe("buildSummaryEmbed", () => {
    it("should return EmbedBuilder with correct color and title", async () => {
      const { buildSummaryEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const embed = buildSummaryEmbed(5, { general: 3, log: 2 });
      expect(embed.data.color).toBe(0x2ecc71);
      expect(embed.data.title).toBe(
        "commands:message-delete.embed.summary_title",
      );
    });

    it("should include total deleted and channel breakdown fields", async () => {
      const { buildSummaryEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const embed = buildSummaryEmbed(5, { general: 5 });
      const fields = embed.data.fields ?? [];
      expect(fields).toHaveLength(2);
      // 1フィールド目: 合計件数
      expect(fields[0].name).toBe(
        "commands:message-delete.embed.total_deleted",
      );
      expect(fields[0].value).toBe("5件");
      // 2フィールド目: チャンネル別内訳
      expect(fields[1].name).toBe(
        "commands:message-delete.embed.channel_breakdown",
      );
    });

    // channelBreakdown が空のときは breakdown_empty キーが使われることを確認
    it("should use breakdown_empty key when channelBreakdown is empty", async () => {
      const { buildSummaryEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const embed = buildSummaryEmbed(0, {});
      const fields = embed.data.fields ?? [];
      expect(fields[1].value).toBe(
        "commands:message-delete.embed.breakdown_empty",
      );
    });
  });

  // buildFilteredRecords のフィルタロジックを検証
  describe("buildFilteredRecords", () => {
    const records: DeletedMessageRecord[] = [
      makeRecord({ authorId: "u1", authorTag: "alice#0001", content: "Hello" }),
      makeRecord({ authorId: "u2", authorTag: "bob#0002", content: "World" }),
      makeRecord({
        authorId: "u1",
        authorTag: "alice#0001",
        content: "Goodbye",
      }),
    ];

    it("should return all records when filter is empty", async () => {
      const { buildFilteredRecords } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      expect(buildFilteredRecords(records, {})).toHaveLength(3);
    });

    it("should filter by authorId", async () => {
      const { buildFilteredRecords } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const result = buildFilteredRecords(records, { authorId: "u1" });
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.authorId === "u1")).toBe(true);
    });

    it("should filter by keyword case-insensitively", async () => {
      const { buildFilteredRecords } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const result = buildFilteredRecords(records, { keyword: "hello" });
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Hello");
    });

    it("should filter by days when after/before are not set", async () => {
      const { buildFilteredRecords } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const mixed: DeletedMessageRecord[] = [
        makeRecord({ createdAt: recentDate }),
        makeRecord({ createdAt: oldDate }),
      ];
      const result = buildFilteredRecords(mixed, { days: 3 });
      expect(result).toHaveLength(1);
      expect(result[0].createdAt).toBe(recentDate);
    });

    // after と before が指定されているとき days フィルターは適用しないことを確認
    it("should not apply days filter when after is set", async () => {
      const { buildFilteredRecords } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const mixed: DeletedMessageRecord[] = [
        makeRecord({ createdAt: oldDate }),
      ];
      // days=3 だが after が指定されているので days フィルターは無効
      const result = buildFilteredRecords(mixed, {
        days: 3,
        after: new Date(0),
      });
      expect(result).toHaveLength(1);
    });

    it("should filter by after date", async () => {
      const { buildFilteredRecords } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const afterDate = new Date("2026-01-10T00:00:00Z");
      const r1 = makeRecord({ createdAt: new Date("2026-01-11T00:00:00Z") });
      const r2 = makeRecord({ createdAt: new Date("2026-01-09T00:00:00Z") });
      const result = buildFilteredRecords([r1, r2], { after: afterDate });
      expect(result).toHaveLength(1);
      expect(result[0].createdAt).toBe(r1.createdAt);
    });

    it("should filter by before date", async () => {
      const { buildFilteredRecords } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const beforeDate = new Date("2026-01-10T00:00:00Z");
      const r1 = makeRecord({ createdAt: new Date("2026-01-09T00:00:00Z") });
      const r2 = makeRecord({ createdAt: new Date("2026-01-11T00:00:00Z") });
      const result = buildFilteredRecords([r1, r2], { before: beforeDate });
      expect(result).toHaveLength(1);
      expect(result[0].createdAt).toBe(r1.createdAt);
    });
  });

  // buildDetailEmbed のページネイション・フィルター表示・空ページを検証
  describe("buildDetailEmbed", () => {
    it("should show no_messages description when filtered records are empty", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const embed = buildDetailEmbed([], 0, 1, {});
      expect(embed.data.color).toBe(0x3498db);
      expect(embed.data.description).toBe(
        "commands:message-delete.embed.no_messages",
      );
    });

    it("should add a field for each record in the current page", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const records = [
        makeRecord({ authorTag: "alice#0001" }),
        makeRecord({ authorTag: "bob#0002" }),
      ];
      const embed = buildDetailEmbed(records, 0, 1, {});
      const fields = embed.data.fields ?? [];
      expect(fields).toHaveLength(2);
      expect(fields[0].name).toContain("alice#0001");
      expect(fields[1].name).toContain("bob#0002");
    });

    // フィルターが有効なとき、タイトルに filter_active キーが付加されることを確認
    it("should append filter_active to title when filter is active", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const embed = buildDetailEmbed([], 0, 1, { keyword: "test" });
      expect(embed.data.title).toContain(
        "commands:message-delete.embed.filter_active",
      );
    });

    it("should not append filter_active when no filter is set", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const embed = buildDetailEmbed([], 0, 1, {});
      expect(embed.data.title).not.toContain(
        "commands:message-delete.embed.filter_active",
      );
    });

    // after/before フィルターが設定されているとき、フッターに日付範囲が表示されることを確認
    it("should set footer with after and before dates when both are set", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const after = new Date("2026-01-01T00:00:00Z");
      const before = new Date("2026-01-31T00:00:00Z");
      const embed = buildDetailEmbed([], 0, 1, { after, before });
      expect(embed.data.footer?.text).toContain("after:");
      expect(embed.data.footer?.text).toContain("before:");
    });

    it("should set footer with only after date when before is not set", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const after = new Date("2026-01-01T00:00:00Z");
      const embed = buildDetailEmbed([], 0, 1, { after });
      expect(embed.data.footer?.text).toContain("after:");
      expect(embed.data.footer?.text).not.toContain("before:");
    });

    it("should set footer with only before date when after is not set", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const before = new Date("2026-01-31T00:00:00Z");
      const embed = buildDetailEmbed([], 0, 1, { before });
      expect(embed.data.footer?.text).not.toContain("after:");
      expect(embed.data.footer?.text).toContain("before:");
    });

    // empty_content キーが content が空のメッセージに使われることを確認
    it("should show empty_content key when record content is empty string", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const record = makeRecord({ content: "" });
      const embed = buildDetailEmbed([record], 0, 1, {});
      const fields = embed.data.fields ?? [];
      expect(fields[0].value).toContain(
        "commands:message-delete.result.empty_content",
      );
    });

    it("should show 2nd page slice correctly", async () => {
      const { buildDetailEmbed } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      // 6件、1ページあたり5件 → 2ページ目は1件
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRecord({ content: `msg-${i}` }),
      );
      const embed = buildDetailEmbed(records, 1, 2, {});
      const fields = embed.data.fields ?? [];
      expect(fields).toHaveLength(1);
    });
  });

  // buildPaginationComponents のボタン状態・セレクトメニューを検証
  describe("buildPaginationComponents", () => {
    it("should return 3 ActionRows (authorSelect, dateRow, navRow)", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rows = buildPaginationComponents([], 0, 1, {});
      expect(rows).toHaveLength(3);
    });

    // author のユニーク一覧の先頭25件がセレクトオプションに含まれることを確認
    it("should include unique author tags in select options (up to 25)", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const records = Array.from({ length: 30 }, (_, i) =>
        makeRecord({ authorTag: `user${i}#0000` }),
      );
      const rows = buildPaginationComponents(records, 0, 1, {});
      const selectMenu = rows[0].components[0];
      // toJSON でオプション数を確認（__all__ + 最大24人 = 25件）
      const json = selectMenu.toJSON() as { options: unknown[] };
      expect(json.options.length).toBeLessThanOrEqual(25);
    });

    // prev ボタンが最初のページでは無効、2ページ目では有効であることを確認
    it("should disable prev button on page 0 and enable on page 1", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rowsPage0 = buildPaginationComponents([], 0, 2, {});
      const rowsPage1 = buildPaginationComponents([], 1, 2, {});
      const navRow0 = rowsPage0[2];
      const navRow1 = rowsPage1[2];
      const [prev0] = navRow0.components;
      const [prev1] = navRow1.components;
      expect((prev0.toJSON() as { disabled?: boolean }).disabled).toBe(true);
      expect((prev1.toJSON() as { disabled?: boolean }).disabled).toBeFalsy();
    });

    // next ボタンが最終ページでは無効、それ以前では有効であることを確認
    it("should disable next button on last page", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rows = buildPaginationComponents([], 1, 2, {});
      const navRow = rows[2];
      const [, next] = navRow.components;
      expect((next.toJSON() as { disabled?: boolean }).disabled).toBe(true);
    });

    // days が設定されているとき after/before ボタンが無効になることを確認
    it("should disable after/before buttons when days filter is set", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rows = buildPaginationComponents([], 0, 1, { days: 3 });
      const dateRow = rows[1];
      const [daysBtn, afterBtn, beforeBtn] = dateRow.components;
      expect((daysBtn.toJSON() as { disabled?: boolean }).disabled).toBeFalsy();
      expect((afterBtn.toJSON() as { disabled?: boolean }).disabled).toBe(true);
      expect((beforeBtn.toJSON() as { disabled?: boolean }).disabled).toBe(
        true,
      );
    });

    // after/before が設定されているとき days ボタンが無効になることを確認
    it("should disable days button when after or before filter is set", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rows = buildPaginationComponents([], 0, 1, {
        after: new Date(),
      });
      const dateRow = rows[1];
      const [daysBtn] = dateRow.components;
      expect((daysBtn.toJSON() as { disabled?: boolean }).disabled).toBe(true);
    });

    // days が設定されているとき days ボタンがラベルと Success スタイルになることを確認
    it("should use Success style and set label for days button when days is set", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rows = buildPaginationComponents([], 0, 1, { days: 7 });
      const dateRow = rows[1];
      const [daysBtn] = dateRow.components;
      const json = daysBtn.toJSON() as { style: number; label: string };
      expect(json.style).toBe(ButtonStyle.Success);
      expect(json.label).toContain('"days":7');
    });

    // after が設定されているとき after ボタンが Success スタイルになることを確認
    it("should use Success style for after button when after is set", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rows = buildPaginationComponents([], 0, 1, {
        after: new Date("2026-01-01T00:00:00Z"),
      });
      const dateRow = rows[1];
      const [, afterBtn] = dateRow.components;
      const json = afterBtn.toJSON() as { style: number };
      expect(json.style).toBe(ButtonStyle.Success);
    });

    // before が設定されているとき before ボタンが Success スタイルになることを確認
    it("should use Success style for before button when before is set", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rows = buildPaginationComponents([], 0, 1, {
        before: new Date("2026-01-31T00:00:00Z"),
      });
      const dateRow = rows[1];
      const [, , beforeBtn] = dateRow.components;
      const json = beforeBtn.toJSON() as { style: number };
      expect(json.style).toBe(ButtonStyle.Success);
    });

    it("should include FILTER_KEYWORD and FILTER_RESET buttons in dateRow", async () => {
      const { buildPaginationComponents } =
        await import("@/bot/features/message-delete/commands/messageDeleteEmbedBuilder");
      const rows = buildPaginationComponents([], 0, 1, {});
      const dateRow = rows[1];
      const btns = dateRow.components.map(
        (c) => (c.toJSON() as { custom_id: string }).custom_id,
      );
      expect(btns).toContain(MSG_DEL_CUSTOM_ID.FILTER_KEYWORD);
      expect(btns).toContain(MSG_DEL_CUSTOM_ID.FILTER_RESET);
    });
  });
});
