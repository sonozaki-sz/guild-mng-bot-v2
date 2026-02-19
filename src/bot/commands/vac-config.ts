// src/bot/commands/vac-config.ts
// VC自動作成機能の設定コマンド（サーバー管理権限専用）

import {
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type CategoryChannel,
  type Guild,
  type VoiceChannel,
} from "discord.js";
import type { Command } from "../../bot/types/discord";
import {
  createInfoEmbed,
  createSuccessEmbed,
} from "../../bot/utils/messageResponse";
import {
  addTriggerChannel,
  getVacConfigOrDefault,
  removeTriggerChannel
} from "../services/shared-access";
import {
  getCommandLocalizations,
  tDefault,
  tGuild
} from "../services/shared-access";
import {
  handleCommandError,
  ValidationError
} from "../services/shared-access";

// VAC 設定コマンドで共通利用するサブコマンド名・オプション名・上限制約の定数
const VAC_CONFIG_COMMAND = {
  NAME: "vac-config",
  SUBCOMMAND: {
    CREATE_TRIGGER: "create-trigger-vc",
    REMOVE_TRIGGER: "remove-trigger-vc",
    SHOW: "show",
  },
  OPTION: {
    CATEGORY: "category",
  },
  TARGET: {
    TOP: "TOP",
  },
  TRIGGER_CHANNEL_NAME: "CreateVC",
  CATEGORY_CHANNEL_LIMIT: 50,
} as const;

export const vacConfigCommand: Command = {
  data: (() => {
    // 各ロケール文言を先に解決して SlashCommandBuilder へ流し込む
    const cmdDesc = getCommandLocalizations("vac-config.description");
    const createDesc = getCommandLocalizations(
      "vac-config.create-trigger-vc.description",
    );
    const removeDesc = getCommandLocalizations(
      "vac-config.remove-trigger-vc.description",
    );
    const createCategoryDesc = getCommandLocalizations(
      "vac-config.create-trigger-vc.category.description",
    );
    const removeCategoryDesc = getCommandLocalizations(
      "vac-config.remove-trigger-vc.category.description",
    );
    const showDesc = getCommandLocalizations("vac-config.show.description");

    return (
      new SlashCommandBuilder()
        .setName(VAC_CONFIG_COMMAND.NAME)
        .setDescription(cmdDesc.ja)
        .setDescriptionLocalizations(cmdDesc.localizations)
        // Discord 側の表示/実行制御として ManageGuild を要求
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((subcommand) =>
          // トリガーVC作成
          subcommand
            .setName(VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER)
            .setDescription(createDesc.ja)
            .setDescriptionLocalizations(createDesc.localizations)
            .addStringOption((option) =>
              option
                .setName(VAC_CONFIG_COMMAND.OPTION.CATEGORY)
                .setDescription(createCategoryDesc.ja)
                .setDescriptionLocalizations(createCategoryDesc.localizations)
                .setRequired(false)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand((subcommand) =>
          // トリガーVC削除
          subcommand
            .setName(VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER)
            .setDescription(removeDesc.ja)
            .setDescriptionLocalizations(removeDesc.localizations)
            .addStringOption((option) =>
              option
                .setName(VAC_CONFIG_COMMAND.OPTION.CATEGORY)
                .setDescription(removeCategoryDesc.ja)
                .setDescriptionLocalizations(removeCategoryDesc.localizations)
                .setRequired(false)
                .setAutocomplete(true),
            ),
        )
        .addSubcommand((subcommand) =>
          // 現在設定の表示
          subcommand
            .setName(VAC_CONFIG_COMMAND.SUBCOMMAND.SHOW)
            .setDescription(showDesc.ja)
            .setDescriptionLocalizations(showDesc.localizations),
        )
    );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Guild外実行は設定変更対象外
      const guildId = interaction.guildId;
      if (!guildId) {
        throw new ValidationError(tDefault("errors:validation.guild_only"));
      }

      // 実行前に管理権限を必須化
      ensureManageGuildPermission(interaction, guildId);

      const subcommand = interaction.options.getSubcommand();
      // サブコマンドに応じて処理を委譲
      switch (subcommand) {
        case VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER:
          // 指定カテゴリ（または既定カテゴリ）へトリガーVCを作成
          await handleCreateTrigger(interaction, guildId);
          break;
        case VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER:
          // 指定カテゴリのトリガーVCを設定・実体ともに削除
          await handleRemoveTrigger(interaction, guildId);
          break;
        case VAC_CONFIG_COMMAND.SUBCOMMAND.SHOW:
          // 現在のトリガー/作成VC状態を表示
          await handleShow(interaction, guildId);
          break;
        default:
          throw new ValidationError(
            tDefault("errors:validation.invalid_subcommand"),
          );
      }
    } catch (error) {
      await handleCommandError(interaction, error);
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    // 対象外コマンド/サブコマンドでは候補を返さない
    const subcommand = interaction.options.getSubcommand();
    if (
      interaction.commandName !== VAC_CONFIG_COMMAND.NAME ||
      (subcommand !== VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER &&
        subcommand !== VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER)
    ) {
      await interaction.respond([]);
      return;
    }

    const focused = interaction.options.getFocused();
    const guild = interaction.guild;
    if (!guild) {
      // guild 文脈なしではカテゴリ候補を生成できない
      await interaction.respond([]);
      return;
    }

    // 指定なし時の「最上位カテゴリ」をローカライズ表示
    const topLabel = await tGuild(
      guild.id,
      "commands:vac-config.remove-trigger-vc.category.top",
    );

    // 候補はカテゴリチャンネルのみを対象とする
    const categoryChoices = guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildCategory)
      .map((category) => ({
        name: category.name,
        value: category.id,
      }));

    // TOP（カテゴリなし）を先頭に、入力文字で絞り込む
    const choices = [
      {
        name: topLabel,
        value: VAC_CONFIG_COMMAND.TARGET.TOP,
      },
      ...categoryChoices,
    ]
      .filter((choice) =>
        choice.name.toLowerCase().includes(focused.toLowerCase()),
      )
      .slice(0, 25);
    // Discord の autocomplete 上限(25件)に合わせて末尾を切り捨てる

    await interaction.respond(choices);
  },

  cooldown: 3,
};

/**
 * 実行ユーザーがサーバー管理権限を持つか検証する関数
 */
function ensureManageGuildPermission(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): void {
  // 実行時にも ManageGuild 権限を再検証（権限変更や想定外経路に備える）
  // Discord UI 側の既定権限設定だけに依存しない防御層
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      tDefault("errors:permission.manage_guild_required", { guildId }),
    );
  }
}

/**
 * トリガーチャンネル作成処理
 */
async function handleCreateTrigger(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const categoryOption = interaction.options.getString(
    VAC_CONFIG_COMMAND.OPTION.CATEGORY,
  );
  // option は id/名前/TOP を許容し、解決規則は共通関数に集約する
  const category = await resolveTargetCategory(
    guild,
    interaction.channelId,
    categoryOption,
  );
  // カテゴリ未指定/ TOP 指定は null（最上位）として扱う
  // null は「カテゴリなし(Top)」として設定側でも一貫して扱う
  const targetCategoryId = category?.id ?? null;
  // remove 側と同じ null ルールで比較し、create/remove の対称性を保つ

  const config = await getVacConfigOrDefault(guildId);
  // 同一カテゴリに既存トリガーがある場合は重複作成しない
  const existingTrigger = await findTriggerChannelByCategory(
    guild,
    config.triggerChannelIds,
    targetCategoryId,
  );
  if (existingTrigger) {
    // 既存トリガーがあるカテゴリには追加作成しない
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.already_exists"),
    );
  }

  // Discordカテゴリのチャンネル上限（50）を超える場合は作成しない
  if (
    category &&
    category.children.cache.size >= VAC_CONFIG_COMMAND.CATEGORY_CHANNEL_LIMIT
  ) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.category_full"),
    );
  }

  const triggerChannel = await guild.channels.create({
    name: VAC_CONFIG_COMMAND.TRIGGER_CHANNEL_NAME,
    type: ChannelType.GuildVoice,
    parent: category?.id ?? null,
  });
  // 作成成功後にのみ設定反映し、実体と設定の乖離を防ぐ

  // DB 設定へ新規トリガーを反映
  await addTriggerChannel(guildId, triggerChannel.id);

  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac-config.embed.trigger_created", {
      channel: `<#${triggerChannel.id}>`,
    }),
  );
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * トリガーチャンネル削除処理
 */
async function handleRemoveTrigger(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const categoryOption = interaction.options.getString(
    VAC_CONFIG_COMMAND.OPTION.CATEGORY,
  );
  const category = await resolveTargetCategory(
    guild,
    interaction.channelId,
    categoryOption,
  );
  // カテゴリ未指定/ TOP 指定は null（最上位）として扱う
  // create/remove で同じ解決規則を使い誤差をなくす
  const targetCategoryId = category?.id ?? null;

  const config = await getVacConfigOrDefault(guildId);
  // 対象カテゴリに紐づくトリガーVCを探索
  const triggerChannel = await findTriggerChannelByCategory(
    guild,
    config.triggerChannelIds,
    targetCategoryId,
  );

  if (!triggerChannel) {
    // 対象カテゴリにトリガーがなければ削除対象なし
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.trigger_not_found"),
      await tGuild(guildId, "commands:vac-config.embed.remove_error_title"),
    );
  }

  // 先に設定を更新してから実チャンネルを削除する
  // 取得済みIDが消えていても設定側の掃除を優先する
  await removeTriggerChannel(guildId, triggerChannel.id);

  const guildChannel = await interaction.guild?.channels
    .fetch(triggerChannel.id)
    .catch(() => null);
  if (guildChannel && guildChannel.type === ChannelType.GuildVoice) {
    // 実チャンネルが残っていれば削除して設定と実体を同期
    // 既に消えている場合は設定側のみ更新済みなのでそのまま完了する
    await guildChannel.delete();
  }

  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac-config.embed.trigger_removed", {
      channel: `#${triggerChannel.name}`,
    }),
  );
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * 操作対象カテゴリを入力値と実行チャンネル文脈から解決する関数
 */
async function resolveTargetCategory(
  guild: Guild,
  interactionChannelId: string,
  categoryOption: string | null,
): Promise<CategoryChannel | null> {
  // 未指定時は実行チャンネルの親カテゴリを既定値として使う
  if (!categoryOption) {
    const currentChannel = await guild.channels
      .fetch(interactionChannelId)
      .catch(() => null);
    // 親がカテゴリでない場合は TOP 扱い（null）にフォールバック
    // create/remove ともに同じ既定解決規則を使う
    return currentChannel?.parent?.type === ChannelType.GuildCategory
      ? currentChannel.parent
      : null;
  }

  // TOP 指定はカテゴリ未所属（null）として扱う
  if (categoryOption.toUpperCase() === VAC_CONFIG_COMMAND.TARGET.TOP) {
    return null;
  }

  // まずID一致で解決
  const byId = await guild.channels.fetch(categoryOption).catch(() => null);
  if (byId?.type === ChannelType.GuildCategory) {
    // ID で解決できた場合は最優先で採用
    return byId;
  }

  // 見つからない場合のみ名前一致でフォールバック
  const byName = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name.toLowerCase() === categoryOption.toLowerCase(),
  );

  if (byName?.type === ChannelType.GuildCategory) {
    // 名前一致は補助的なフォールバック
    return byName;
  }

  // 解決不能時は TOP（null）へは寄せず、呼び出し側で未一致として扱う
  return null;
}

/**
 * 指定カテゴリに対応する VAC トリガーチャンネルを探索する関数
 */
async function findTriggerChannelByCategory(
  guild: Guild,
  triggerChannelIds: string[],
  categoryId: string | null,
): Promise<VoiceChannel | null> {
  for (const triggerId of triggerChannelIds) {
    // 設定上の各トリガーIDを実チャンネルへ解決して照合
    const channel = await guild.channels.fetch(triggerId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      // 消失済み/型不一致IDはスキップして探索を継続
      continue;
    }

    const parentId =
      channel.parent?.type === ChannelType.GuildCategory
        ? channel.parent.id
        : null;
    if (parentId === categoryId) {
      return channel;
    }
  }

  return null;
}

/**
 * 現在のVAC設定表示処理
 */
async function handleShow(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const config = await getVacConfigOrDefault(guildId);

  const topLabel = await tGuild(guildId, "commands:vac-config.embed.top");

  // トリガーVC一覧（カテゴリ名付き）を組み立て
  const triggerChannels =
    config.triggerChannelIds.length > 0
      ? (
          await Promise.all(
            config.triggerChannelIds.map(async (id) => {
              const channel = await guild.channels.fetch(id).catch(() => null);
              const categoryLabel =
                channel?.parent?.type === ChannelType.GuildCategory
                  ? channel.parent.name
                  : topLabel;
              return `<#${id}> (${categoryLabel})`;
            }),
          )
        ).join("\n")
      : await tGuild(guildId, "commands:vac-config.embed.not_configured");
  // 不整合IDがあっても表示生成を継続し、show 自体は失敗させない

  // 作成済みVC一覧（VC + オーナー）を組み立て
  const createdVcDetails =
    config.createdChannels.length > 0
      ? config.createdChannels
          .map((item) => `<#${item.voiceChannelId}>(<@${item.ownerId}>)`)
          .join("\n")
      : await tGuild(guildId, "commands:vac-config.embed.no_created_vcs");

  const title = await tGuild(guildId, "commands:vac-config.embed.title");
  const fieldTrigger = await tGuild(
    guildId,
    "commands:vac-config.embed.field.trigger_channels",
  );
  const fieldCreatedDetails = await tGuild(
    guildId,
    "commands:vac-config.embed.field.created_vc_details",
  );

  // show レスポンスEmbedを返す
  const embed = createInfoEmbed("", {
    title,
    fields: [
      { name: fieldTrigger, value: triggerChannels, inline: false },
      {
        name: fieldCreatedDetails,
        value: createdVcDetails,
        inline: false,
      },
    ],
  });

  // 管理系コマンドのため Ephemeral で返す
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

export default vacConfigCommand;
