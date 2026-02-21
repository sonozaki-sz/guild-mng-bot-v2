import { autocompleteVacConfigCommand } from "@/bot/features/vac/commands/vacConfigCommand.autocomplete";
import { VAC_CONFIG_COMMAND } from "@/bot/features/vac/commands/vacConfigCommand.constants";
import { ChannelType } from "discord.js";

jest.mock("@/shared/locale", () => ({
  tGuild: jest.fn(async (_guildId: string, _key: string) => "TOP"),
}));

type CategoryLike = { id: string; name: string; type: ChannelType };

function createCache(items: CategoryLike[]) {
  return {
    filter: (predicate: (item: CategoryLike) => boolean) => ({
      map: <T>(mapper: (item: CategoryLike) => T) =>
        items.filter(predicate).map(mapper),
    }),
  };
}

describe("bot/features/vac/commands/vacConfigCommand.autocomplete", () => {
  // サブコマンド判定・入力絞り込み・件数制限の分岐を検証する
  it("responds empty for non-vac-config command", async () => {
    const respond = jest.fn();
    const interaction = {
      commandName: "other-command",
      options: {
        getSubcommand: jest.fn(() => "any"),
        getFocused: jest.fn(() => ""),
      },
      guild: null,
      respond,
    };

    await autocompleteVacConfigCommand(interaction as never);

    expect(respond).toHaveBeenCalledWith([]);
  });

  it("responds empty when guild context is missing", async () => {
    const respond = jest.fn();
    const interaction = {
      commandName: VAC_CONFIG_COMMAND.NAME,
      options: {
        getSubcommand: jest.fn(
          () => VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER,
        ),
        getFocused: jest.fn(() => ""),
      },
      guild: null,
      respond,
    };

    await autocompleteVacConfigCommand(interaction as never);

    expect(respond).toHaveBeenCalledWith([]);
  });

  it("returns TOP and matching categories with case-insensitive filtering", async () => {
    const respond = jest.fn();
    const interaction = {
      commandName: VAC_CONFIG_COMMAND.NAME,
      options: {
        getSubcommand: jest.fn(
          () => VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER,
        ),
        getFocused: jest.fn(() => "ga"),
      },
      guild: {
        id: "guild-1",
        channels: {
          cache: createCache([
            {
              id: "cat-1",
              name: "Game",
              type: ChannelType.GuildCategory,
            },
            {
              id: "cat-2",
              name: "General",
              type: ChannelType.GuildCategory,
            },
            { id: "text-1", name: "chat", type: ChannelType.GuildText },
          ]),
        },
      },
      respond,
    };

    await autocompleteVacConfigCommand(interaction as never);

    expect(respond).toHaveBeenCalledWith([{ name: "Game", value: "cat-1" }]);
  });

  it("limits autocomplete choices to 25", async () => {
    const respond = jest.fn();
    const categories = Array.from({ length: 30 }, (_, index) => ({
      id: `cat-${index}`,
      name: `Category-${index}`,
      type: ChannelType.GuildCategory,
    }));

    const interaction = {
      commandName: VAC_CONFIG_COMMAND.NAME,
      options: {
        getSubcommand: jest.fn(
          () => VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER,
        ),
        getFocused: jest.fn(() => ""),
      },
      guild: {
        id: "guild-1",
        channels: {
          cache: createCache(categories),
        },
      },
      respond,
    };

    await autocompleteVacConfigCommand(interaction as never);

    const choices = respond.mock.calls[0][0] as Array<{
      name: string;
      value: string;
    }>;

    expect(choices).toHaveLength(25);
    expect(choices[0]).toEqual({
      name: "TOP",
      value: VAC_CONFIG_COMMAND.TARGET.TOP,
    });
  });
});
