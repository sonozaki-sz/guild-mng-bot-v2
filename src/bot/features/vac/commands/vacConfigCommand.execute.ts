// src/bot/features/vac/commands/vacConfigCommand.execute.ts
// VAC 設定コマンド実行処理

import {
  ChannelType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { ValidationError } from "../../../../shared/errors";
import { tDefault, tGuild } from "../../../../shared/locale";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import {
  createInfoEmbed,
  createSuccessEmbed,
} from "../../../utils/messageResponse";
import { getVacRepository } from "../repositories";
import {
  findTriggerChannelByCategory,
  resolveTargetCategory,
} from "./helpers/vacConfigTargetResolver";
import { presentVacConfigShow } from "./presenters/vacConfigShowPresenter";
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
  const presentation = await presentVacConfigShow(guild, guildId, config);

  // トリガー一覧と作成済みVC一覧を Embed で返す
  const embed = createInfoEmbed("", {
    title: presentation.title,
    fields: [
      {
        name: presentation.fieldTrigger,
        value: presentation.triggerChannels,
        inline: false,
      },
      {
        name: presentation.fieldCreatedDetails,
        value: presentation.createdVcDetails,
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
