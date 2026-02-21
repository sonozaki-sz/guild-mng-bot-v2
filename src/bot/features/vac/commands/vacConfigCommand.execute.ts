// src/bot/features/vac/commands/vacConfigCommand.execute.ts
// VAC 設定コマンド実行処理

import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  type CategoryChannel,
  type Guild,
  type VoiceChannel,
} from "discord.js";
import { ValidationError } from "../../../../shared/errors";
import { tDefault, tGuild } from "../../../../shared/locale";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import {
  createInfoEmbed,
  createSuccessEmbed,
} from "../../../utils/messageResponse";
import { getVacRepository } from "../repositories";
import { VAC_CONFIG_COMMAND } from "./vacConfigCommand.constants";

/**
 * vac-config コマンド実行入口
 * @param interaction コマンド実行インタラクション
 * @returns 実行完了を示す Promise
 */
export async function executeVacConfigCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    // Guild 外実行は設定変更対象外
    const guildId = interaction.guildId;
    if (!guildId) {
      throw new ValidationError(tDefault("errors:validation.guild_only"));
    }

    // 実行前に管理権限を検証
    ensureManageGuildPermission(interaction, guildId);

    // サブコマンド別に処理を委譲
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case VAC_CONFIG_COMMAND.SUBCOMMAND.CREATE_TRIGGER:
        await handleCreateTrigger(interaction, guildId);
        break;
      case VAC_CONFIG_COMMAND.SUBCOMMAND.REMOVE_TRIGGER:
        await handleRemoveTrigger(interaction, guildId);
        break;
      case VAC_CONFIG_COMMAND.SUBCOMMAND.SHOW:
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
}

/**
 * 実行ユーザーがサーバー管理権限を持つか検証する関数
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 検証完了（権限不足時は例外送出）
 */
function ensureManageGuildPermission(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): void {
  // Discord UI 側の既定権限に依存せず、実行時にも管理権限を確認
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      tDefault("errors:permission.manage_guild_required", { guildId }),
    );
  }
}

/**
 * トリガーチャンネル作成処理
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
async function handleCreateTrigger(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行コンテキストから対象カテゴリを解決
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
  const targetCategoryId = category?.id ?? null;

  const config = await getVacRepository().getVacConfigOrDefault(guildId);
  // 同一カテゴリへの重複トリガー作成を防止
  const existingTrigger = await findTriggerChannelByCategory(
    guild,
    config.triggerChannelIds,
    targetCategoryId,
  );
  if (existingTrigger) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.already_exists"),
    );
  }

  // カテゴリ上限に達している場合は作成を中止
  if (
    category &&
    category.children.cache.size >= VAC_CONFIG_COMMAND.CATEGORY_CHANNEL_LIMIT
  ) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.category_full"),
    );
  }

  // 実チャンネル作成後に設定へ反映して整合を保つ
  const triggerChannel = await guild.channels.create({
    name: VAC_CONFIG_COMMAND.TRIGGER_CHANNEL_NAME,
    type: ChannelType.GuildVoice,
    parent: category?.id ?? null,
  });

  // 作成したトリガーVCを設定へ反映して永続化する
  await getVacRepository().addTriggerChannel(guildId, triggerChannel.id);

  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac-config.embed.trigger_created", {
      channel: `<#${triggerChannel.id}>`,
    }),
  );
  // 管理系操作の結果は Ephemeral で返してチャンネルノイズを抑える
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * トリガーチャンネル削除処理
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
async function handleRemoveTrigger(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行コンテキストから対象カテゴリを解決
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
  const targetCategoryId = category?.id ?? null;

  // 設定上の対象トリガーを特定
  const config = await getVacRepository().getVacConfigOrDefault(guildId);
  const triggerChannel = await findTriggerChannelByCategory(
    guild,
    config.triggerChannelIds,
    targetCategoryId,
  );

  if (!triggerChannel) {
    throw new ValidationError(
      await tGuild(guildId, "errors:vac.trigger_not_found"),
      await tGuild(guildId, "commands:vac-config.embed.remove_error_title"),
    );
  }

  // 設定を先に更新し、実体削除は後続で試行する
  await getVacRepository().removeTriggerChannel(guildId, triggerChannel.id);

  const guildChannel = await interaction.guild?.channels
    .fetch(triggerChannel.id)
    .catch(() => null);
  if (guildChannel && guildChannel.type === ChannelType.GuildVoice) {
    await guildChannel.delete();
  }

  const embed = createSuccessEmbed(
    await tGuild(guildId, "commands:vac-config.embed.trigger_removed", {
      channel: `#${triggerChannel.name}`,
    }),
  );
  // 管理系操作の結果は Ephemeral で返してチャンネルノイズを抑える
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * 操作対象カテゴリを入力値と実行チャンネル文脈から解決する関数
 * @param guild 参照対象のギルド
 * @param interactionChannelId 実行チャンネルID
 * @param categoryOption コマンド入力カテゴリ値
 * @returns 解決済みカテゴリ（TOP時は null）
 */
async function resolveTargetCategory(
  guild: Guild,
  interactionChannelId: string,
  categoryOption: string | null,
): Promise<CategoryChannel | null> {
  // 未指定時は実行チャンネルの親カテゴリを既定値として採用
  if (!categoryOption) {
    const currentChannel = await guild.channels
      .fetch(interactionChannelId)
      .catch(() => null);
    return currentChannel?.parent?.type === ChannelType.GuildCategory
      ? currentChannel.parent
      : null;
  }

  // TOP 指定はカテゴリ未所属（null）として扱う
  if (categoryOption.toUpperCase() === VAC_CONFIG_COMMAND.TARGET.TOP) {
    return null;
  }

  // ID 解決を優先し、見つからない場合のみ名前一致で補完
  const byId = await guild.channels.fetch(categoryOption).catch(() => null);
  if (byId?.type === ChannelType.GuildCategory) {
    return byId;
  }

  const byName = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name.toLowerCase() === categoryOption.toLowerCase(),
  );

  if (byName?.type === ChannelType.GuildCategory) {
    return byName;
  }

  return null;
}

/**
 * 指定カテゴリに対応する VAC トリガーチャンネルを探索する関数
 * @param guild 参照対象のギルド
 * @param triggerChannelIds 設定済みトリガーチャンネルID一覧
 * @param categoryId 探索対象カテゴリID（TOP時は null）
 * @returns 一致したトリガーチャンネル（未一致時は null）
 */
async function findTriggerChannelByCategory(
  guild: Guild,
  triggerChannelIds: string[],
  categoryId: string | null,
): Promise<VoiceChannel | null> {
  // 設定済みトリガー候補を順に実体解決してカテゴリ一致を判定
  for (const triggerId of triggerChannelIds) {
    const channel = await guild.channels.fetch(triggerId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
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
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
async function handleShow(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 最新設定を読み込み、表示用の文字列へ整形
  const guild = interaction.guild;
  if (!guild) {
    throw new ValidationError(tDefault("errors:validation.guild_only"));
  }

  const config = await getVacRepository().getVacConfigOrDefault(guildId);
  const topLabel = await tGuild(guildId, "commands:vac-config.embed.top");

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

  // トリガー一覧と作成済みVC一覧を Embed で返す
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

  // 設定表示も管理操作のため Ephemeral で返す
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}
