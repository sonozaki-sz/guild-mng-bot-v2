// tests/unit/bot/features/message-delete/constants/messageDeleteConstants.test.ts

// message-delete 機能の定数値・コマンド名・カスタムIDの整合性を検証
describe("bot/features/message-delete/constants/messageDeleteConstants", () => {
  async function loadModule() {
    return import("@/bot/features/message-delete/constants/messageDeleteConstants");
  }

  // MSG_DEL_CUSTOM_ID の各キーが仕様どおりの文字列値を持つことを検証
  describe("MSG_DEL_CUSTOM_ID", () => {
    it("should export confirm button custom IDs", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_CUSTOM_ID.CONFIRM_YES).toBe("msgdel_confirm_yes");
      expect(mod.MSG_DEL_CUSTOM_ID.CONFIRM_NO).toBe("msgdel_confirm_no");
      expect(mod.MSG_DEL_CUSTOM_ID.CONFIRM_SKIP_TOGGLE).toBe(
        "msgdel_confirm_skip_toggle",
      );
    });

    it("should export pagination custom IDs", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_CUSTOM_ID.PREV).toBe("msgdel_prev");
      expect(mod.MSG_DEL_CUSTOM_ID.NEXT).toBe("msgdel_next");
    });

    it("should export filter button custom IDs", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_CUSTOM_ID.FILTER_AUTHOR).toBe("msgdel_filter_author");
      expect(mod.MSG_DEL_CUSTOM_ID.FILTER_KEYWORD).toBe(
        "msgdel_filter_keyword",
      );
      expect(mod.MSG_DEL_CUSTOM_ID.FILTER_DAYS).toBe("msgdel_filter_days");
      expect(mod.MSG_DEL_CUSTOM_ID.FILTER_AFTER).toBe("msgdel_filter_after");
      expect(mod.MSG_DEL_CUSTOM_ID.FILTER_BEFORE).toBe("msgdel_filter_before");
      expect(mod.MSG_DEL_CUSTOM_ID.FILTER_RESET).toBe("msgdel_filter_reset");
    });

    it("should export modal custom IDs", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_CUSTOM_ID.MODAL_KEYWORD).toBe("msgdel_modal_keyword");
      expect(mod.MSG_DEL_CUSTOM_ID.MODAL_DAYS).toBe("msgdel_modal_days");
      expect(mod.MSG_DEL_CUSTOM_ID.MODAL_AFTER).toBe("msgdel_modal_after");
      expect(mod.MSG_DEL_CUSTOM_ID.MODAL_BEFORE).toBe("msgdel_modal_before");
      expect(mod.MSG_DEL_CUSTOM_ID.MODAL_INPUT_KEYWORD).toBe(
        "msgdel_modal_input_keyword",
      );
      expect(mod.MSG_DEL_CUSTOM_ID.MODAL_INPUT_DAYS).toBe(
        "msgdel_modal_input_days",
      );
      expect(mod.MSG_DEL_CUSTOM_ID.MODAL_INPUT_AFTER).toBe(
        "msgdel_modal_input_after",
      );
      expect(mod.MSG_DEL_CUSTOM_ID.MODAL_INPUT_BEFORE).toBe(
        "msgdel_modal_input_before",
      );
    });
  });

  // 数値定数が仕様どおりの値であることを検証
  describe("numeric constants", () => {
    it("should export correct page size and timeout values", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_PAGE_SIZE).toBe(5);
      expect(mod.MSG_DEL_CONFIRM_TIMEOUT_MS).toBe(60_000);
      expect(mod.MSG_DEL_PAGINATION_TIMEOUT_MS).toBe(15 * 60 * 1000);
    });

    it("should export correct batch size constants", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_BULK_BATCH_SIZE).toBe(100);
      expect(mod.MSG_DEL_FETCH_BATCH_SIZE).toBe(100);
    });

    it("should export correct wait and age constants", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_BULK_WAIT_MS).toBe(1000);
      expect(mod.MSG_DEL_INDIVIDUAL_WAIT_MS).toBe(500);
      expect(mod.MSG_DEL_BULK_MAX_AGE_MS).toBe(14 * 24 * 60 * 60 * 1000);
      expect(mod.MSG_DEL_CONTENT_MAX_LENGTH).toBe(200);
    });
  });

  // コマンド名定数が仕様どおりの文字列値を持つことを検証
  describe("MSG_DEL_COMMAND", () => {
    it("should export correct command name", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_COMMAND.NAME).toBe("message-delete");
    });

    it("should export all option names", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_COMMAND.OPTION.COUNT).toBe("count");
      expect(mod.MSG_DEL_COMMAND.OPTION.USER).toBe("user");
      expect(mod.MSG_DEL_COMMAND.OPTION.BOT).toBe("bot");
      expect(mod.MSG_DEL_COMMAND.OPTION.KEYWORD).toBe("keyword");
      expect(mod.MSG_DEL_COMMAND.OPTION.DAYS).toBe("days");
      expect(mod.MSG_DEL_COMMAND.OPTION.AFTER).toBe("after");
      expect(mod.MSG_DEL_COMMAND.OPTION.BEFORE).toBe("before");
      expect(mod.MSG_DEL_COMMAND.OPTION.CHANNEL).toBe("channel");
    });
  });

  // config コマンド定数が仕様どおりであることを検証
  describe("MSG_DEL_CONFIG_COMMAND", () => {
    it("should export correct config command name and option", async () => {
      const mod = await loadModule();
      expect(mod.MSG_DEL_CONFIG_COMMAND.NAME).toBe("message-delete-config");
      expect(mod.MSG_DEL_CONFIG_COMMAND.OPTION.CONFIRM).toBe("confirm");
    });
  });
});
