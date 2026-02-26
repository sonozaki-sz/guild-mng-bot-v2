// tests/unit/bot/features/vac/commands/helpers/vacConfigTargetResolver.test.ts
import {
  findTriggerChannelByCategory,
  resolveTargetCategory,
} from "@/bot/features/vac/commands/helpers/vacConfigTargetResolver";
import { ChannelType } from "discord.js";

describe("bot/features/vac/commands/helpers/vacConfigTargetResolver", () => {
  // カテゴリ解決とトリガー探索の分岐を安定して検証する
  describe("resolveTargetCategory", () => {
    it("returns parent category when option is omitted", async () => {
      const category = {
        id: "cat-1",
        name: "General",
        type: ChannelType.GuildCategory,
      };
      const guild = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            parent: category,
          }),
          cache: { find: vi.fn() },
        },
      };

      const result = await resolveTargetCategory(
        guild as never,
        "channel-1",
        null,
      );

      expect(result).toEqual(category);
    });

    it("returns null when TOP is specified", async () => {
      const fetch = vi.fn();
      const guild = {
        channels: {
          fetch,
          cache: { find: vi.fn() },
        },
      };

      const result = await resolveTargetCategory(
        guild as never,
        "channel-1",
        "TOP",
      );

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("resolves category by id first, then falls back to name", async () => {
      const categoryByName = {
        id: "cat-2",
        name: "TargetCategory",
        type: ChannelType.GuildCategory,
      };
      const guild = {
        channels: {
          fetch: vi.fn().mockResolvedValue({
            id: "voice-1",
            type: ChannelType.GuildVoice,
          }),
          cache: {
            find: vi.fn((predicate: (item: unknown) => boolean) => {
              const candidates = [categoryByName];
              return candidates.find(predicate);
            }),
          },
        },
      };

      const result = await resolveTargetCategory(
        guild as never,
        "channel-1",
        "targetcategory",
      );

      expect(result).toEqual(categoryByName);
    });
  });

  describe("findTriggerChannelByCategory", () => {
    it("returns first voice trigger channel matching category", async () => {
      const guild = {
        channels: {
          fetch: vi
            .fn()
            .mockResolvedValueOnce({
              id: "text-1",
              type: ChannelType.GuildText,
            })
            .mockResolvedValueOnce({
              id: "voice-1",
              type: ChannelType.GuildVoice,
              parent: { id: "cat-x", type: ChannelType.GuildCategory },
            })
            .mockResolvedValueOnce({
              id: "voice-2",
              type: ChannelType.GuildVoice,
              parent: { id: "cat-1", type: ChannelType.GuildCategory },
            }),
        },
      };

      const result = await findTriggerChannelByCategory(
        guild as never,
        ["text-1", "voice-1", "voice-2"],
        "cat-1",
      );

      expect(result?.id).toBe("voice-2");
    });

    it("returns null when no trigger matches category", async () => {
      const guild = {
        channels: {
          fetch: vi
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
              id: "voice-1",
              type: ChannelType.GuildVoice,
              parent: { id: "cat-x", type: ChannelType.GuildCategory },
            }),
        },
      };

      const result = await findTriggerChannelByCategory(
        guild as never,
        ["missing", "voice-1"],
        "cat-1",
      );

      expect(result).toBeNull();
    });
  });
});
