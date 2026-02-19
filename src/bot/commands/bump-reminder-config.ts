// src/bot/commands/bump-reminder-config.ts
// Bumpリマインダー機能の設定コマンド（サーバー管理権限専用）

import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  DiscordAPIError,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import type { Command } from "../../bot/types/discord";
import { logger } from "../../shared/utils/logger";
import {
  createErrorEmbed,
  createInfoEmbed,
  createSuccessEmbed,
} from "../../bot/utils/messageResponse";
import { getBumpReminderManager } from "../features/bump-reminder";
import {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  getBumpReminderConfigService,
  type BumpReminderConfig
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

// Bump リマインダー設定コマンドで共有する名前・選択値・customId 定数
const BUMP_REMINDER_CONFIG_COMMAND = {
  NAME: "bump-reminder-config",
  SUBCOMMAND: {
    ENABLE: "enable",
    DISABLE: "disable",
    SET_MENTION: "set-mention",
    REMOVE_MENTION: "remove-mention",
    SHOW: "show",
  },
  OPTION: {
    ROLE: "role",
    USER: "user",
    TARGET: "target",
  },
  TARGET_VALUE: {
    ROLE: "role",
    USER: "user",
    USERS: "users",
    ALL: "all",
  },
  CUSTOM_ID_PREFIX: {
    REMOVE_USERS: "bump-remove-users-",
  },
} as const;

/**
 * Bumpリマインダー設定コマンド（サーバー管理権限専用）
 */
export const bumpReminderConfigCommand: Command = {
  data: (() => {
    // 各ロケール文言を先に解決して SlashCommandBuilder へ流し込む
    const cmdDesc = getCommandLocalizations("bump-reminder-config.description");
    const enableDesc = getCommandLocalizations(
      "bump-reminder-config.enable.description",
    );
    const disableDesc = getCommandLocalizations(
      "bump-reminder-config.disable.description",
    );
    const setMentionDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.description",
    );
    const roleDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.role.description",
    );
    const userDesc = getCommandLocalizations(
      "bump-reminder-config.set-mention.user.description",
    );
    const removeMentionDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.description",
    );
    const targetDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.description",
    );
    const targetRoleDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.role",
    );
    const targetUserDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.user",
    );
    const targetUsersDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.users",
    );
    const targetAllDesc = getCommandLocalizations(
      "bump-reminder-config.remove-mention.target.all",
    );
    const showDesc = getCommandLocalizations(
      "bump-reminder-config.show.description",
    );

    return (
      new SlashCommandBuilder()
        .setName(BUMP_REMINDER_CONFIG_COMMAND.NAME)
        .setDescription(cmdDesc.ja)
        .setDescriptionLocalizations(cmdDesc.localizations)
        // Discord 側の表示/実行制御として ManageGuild を要求
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((subcommand) =>
          // 機能有効化
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.ENABLE)
            .setDescription(enableDesc.ja)
            .setDescriptionLocalizations(enableDesc.localizations),
        )
        .addSubcommand((subcommand) =>
          // 機能無効化
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.DISABLE)
            .setDescription(disableDesc.ja)
            .setDescriptionLocalizations(disableDesc.localizations),
        )
        .addSubcommand((subcommand) =>
          // メンション対象設定（role/user）
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SET_MENTION)
            .setDescription(setMentionDesc.ja)
            .setDescriptionLocalizations(setMentionDesc.localizations)
            .addRoleOption((option) =>
              option
                .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.ROLE)
                .setDescription(roleDesc.ja)
                .setDescriptionLocalizations(roleDesc.localizations)
                .setRequired(false),
            )
            .addUserOption((option) =>
              option
                .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.USER)
                .setDescription(userDesc.ja)
                .setDescriptionLocalizations(userDesc.localizations)
                .setRequired(false),
            ),
        )
        .addSubcommand((subcommand) =>
          // メンション設定削除（target別）
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.REMOVE_MENTION)
            .setDescription(removeMentionDesc.ja)
            .setDescriptionLocalizations(removeMentionDesc.localizations)
            .addStringOption((option) =>
              option
                .setName(BUMP_REMINDER_CONFIG_COMMAND.OPTION.TARGET)
                .setDescription(targetDesc.ja)
                .setDescriptionLocalizations(targetDesc.localizations)
                .setRequired(true)
                .addChoices(
                  {
                    name: targetRoleDesc.ja,
                    name_localizations: targetRoleDesc.localizations,
                    value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ROLE,
                  },
                  {
                    name: targetUserDesc.ja,
                    name_localizations: targetUserDesc.localizations,
                    value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USER,
                  },
                  {
                    name: targetUsersDesc.ja,
                    name_localizations: targetUsersDesc.localizations,
                    value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USERS,
                  },
                  {
                    name: targetAllDesc.ja,
                    name_localizations: targetAllDesc.localizations,
                    value: BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ALL,
                  },
                ),
            ),
        )
        .addSubcommand((subcommand) =>
          // 現在設定表示
          subcommand
            .setName(BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SHOW)
            .setDescription(showDesc.ja)
            .setDescriptionLocalizations(showDesc.localizations),
        )
    );
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      // Guild ID取得
      const guildId = interaction.guildId;
      if (!guildId) {
        throw new ValidationError(tDefault("errors:validation.guild_only"));
      }

      // 実行時にも ManageGuild 権限を再検証（権限変更や想定外経路に備える）
      if (
        !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
      ) {
        throw new ValidationError(
          await tGuild(guildId, "errors:permission.manage_guild_required"),
        );
      }

      const subcommand = interaction.options.getSubcommand();

      // サブコマンドごとの処理へ分岐
      // すべての分岐で管理権限チェック済み前提を共有する
      switch (subcommand) {
        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.ENABLE:
          // 通知機能の有効化（通知先は実行チャンネル）
          await handleEnable(interaction, guildId);
          break;

        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.DISABLE:
          // 通知機能の停止（進行中タイマーも解除）
          await handleDisable(interaction, guildId);
          break;

        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SET_MENTION:
          // メンション対象（role/user）を追加・切替
          await handleSetMention(interaction, guildId);
          break;

        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.REMOVE_MENTION:
          // target 指定に応じてロール/ユーザー設定を削除
          await handleRemoveMention(interaction, guildId);
          break;

        case BUMP_REMINDER_CONFIG_COMMAND.SUBCOMMAND.SHOW:
          // 現在の保存設定を Embed で表示
          await handleShowSetting(interaction, guildId);
          break;

        default:
          throw new ValidationError(
            tDefault("errors:validation.invalid_subcommand"),
          );
      }
    } catch (error) {
      // 統一エラーハンドリング
      await handleCommandError(interaction, error);
    }
  },

  cooldown: 3,
};

/**
 * 機能有効化処理
 */
async function handleEnable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも ManageGuild 権限を再検証（権限変更や想定外経路に備える）
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  // チャンネルIDを保存（メッセージ送信時に必要）
  // enable 実行チャンネルを通知先として記録する
  const channelId = interaction.channelId;

  // 新しい設定を保存（メンション設定は原子的に保持）
  await getBumpReminderConfigService().setBumpReminderEnabled(
    guildId,
    true,
    channelId,
  );

  // 成功メッセージ
  // enable/disable/set/remove で成功タイトルを統一して UI の一貫性を保つ
  const description = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.enable_success",
  );
  const successTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.success_title",
  );
  const embed = createSuccessEmbed(description, { title: successTitle });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  logger.info(
    tDefault("system:log.bump_reminder_enabled", { guildId, channelId }),
  );
}

/**
 * 機能無効化処理
 */
async function handleDisable(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも ManageGuild 権限を再検証（権限変更や想定外経路に備える）
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  // 進行中のタイマーをキャンセル
  // 機能停止時は pending タスクを先に止める
  const bumpReminderManager = getBumpReminderManager();
  await bumpReminderManager.cancelReminder(guildId);

  // 設定を無効化（メンション設定は原子的に保持）
  await getBumpReminderConfigService().setBumpReminderEnabled(guildId, false);

  // 成功メッセージ
  // 停止系でも同一 success_title を使い、状態変更通知の見た目を揃える
  const description = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.disable_success",
  );
  const successTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.success_title",
  );
  const embed = createSuccessEmbed(description, { title: successTitle });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  logger.info(tDefault("system:log.bump_reminder_disabled", { guildId }));
}

/**
 * メンションロール・ユーザー設定処理
 */
async function handleSetMention(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも ManageGuild 権限を再検証（権限変更や想定外経路に備える）
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  const role = interaction.options.getRole(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.ROLE,
  );
  const user = interaction.options.getUser(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.USER,
  );
  const bumpReminderConfigService = getBumpReminderConfigService();
  // 既存設定を基準に差分更新するため先に取得
  const currentConfig =
    await bumpReminderConfigService.getBumpReminderConfig(guildId);

  // どちらも指定されていない場合はエラー（他のバリデーションと一貫して ValidationError をスロー）
  if (!role && !user) {
    throw new ValidationError(
      await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.set_mention_error",
      ),
    );
  }

  let userMessage = "";
  let latestConfig = currentConfig;

  if (user) {
    // 既存状態に応じて「追加 / 解除」をトグル動作させる
    // 単一UIでトグルを提供し、管理操作の往復回数を減らす
    const addResult =
      await bumpReminderConfigService.addBumpReminderMentionUser(
        guildId,
        user.id,
      );

    if (addResult === BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED) {
      // 新規追加できた場合の成功文言
      userMessage = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.set_mention_user_added",
        {
          user: `<@${user.id}>`,
        },
      );
    } else if (
      addResult === BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS
    ) {
      // 既存登録済みユーザーはトグル仕様で削除へ切り替える
      const removeResult =
        await bumpReminderConfigService.removeBumpReminderMentionUser(
          guildId,
          user.id,
        );

      if (
        removeResult === BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_CONFIGURED
      ) {
        throw new ValidationError(
          await tGuild(
            guildId,
            "commands:bump-reminder-config.embed.set_mention_error",
          ),
        );
      }

      userMessage = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.set_mention_user_removed",
        {
          user: `<@${user.id}>`,
        },
      );
    } else {
      throw new ValidationError(
        await tGuild(
          guildId,
          "commands:bump-reminder-config.embed.set_mention_error",
        ),
      );
    }

    latestConfig =
      await bumpReminderConfigService.getBumpReminderConfig(guildId);
    // 直後再取得で role 更新時に古い配列を書き戻す事故を避ける
  }

  if (role) {
    // role 指定時はユーザー更新とは独立して上書き
    const roleResult =
      await bumpReminderConfigService.setBumpReminderMentionRole(
        guildId,
        role.id,
      );
    if (roleResult === BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED) {
      throw new ValidationError(
        await tGuild(
          guildId,
          "commands:bump-reminder-config.embed.set_mention_error",
        ),
      );
    }
    latestConfig =
      await bumpReminderConfigService.getBumpReminderConfig(guildId);
  }

  const finalMentionRoleId = latestConfig?.mentionRoleId;
  const finalMentionUserIds = latestConfig?.mentionUserIds ?? [];

  // 実際に変更があった項目だけメッセージへ積む
  const messages: string[] = [];
  if (role) {
    const roleMessage = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.set_mention_role_success",
      {
        role: `<@&${role.id}>`,
      },
    );
    messages.push(roleMessage);
  }
  if (userMessage) {
    messages.push(userMessage);
  }

  const embed = createSuccessEmbed(messages.join("\n"), {
    // 変更項目をまとめて1レスポンスで返す
    // role/user を同時指定した場合でも単一メッセージで結果を確認できる
    title: await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.success_title",
    ),
  });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  logger.info(
    tDefault("system:log.bump_reminder_mention_set", {
      guildId,
      roleId: finalMentionRoleId || "none",
      userIds: finalMentionUserIds.join(",") || "none",
    }),
  );
}

/**
 * 設定表示処理
 */
async function handleShowSetting(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも ManageGuild 権限を再検証（権限変更や想定外経路に備える）
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  const config =
    await getBumpReminderConfigService().getBumpReminderConfig(guildId);

  // 設定がない場合
  if (!config) {
    const title = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.title",
    );
    const message = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.not_configured",
    );
    const embed = createInfoEmbed(message, { title });
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 設定表示
  const showTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.title",
  );
  const fieldStatus = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.status",
  );
  const fieldMentionRole = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.mention_role",
  );
  const fieldMentionUsers = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.field.mention_users",
  );
  const labelEnabled = await tGuild(guildId, "common:enabled");
  const labelDisabled = await tGuild(guildId, "common:disabled");
  const labelNone = await tGuild(guildId, "common:none");

  // show 返信用に状態/ロール/ユーザーを3フィールドで表示
  const embed = createInfoEmbed("", {
    title: showTitle,
    fields: [
      // enabled/role/users を固定順で出し、差分確認しやすくする
      {
        name: fieldStatus,
        value: config.enabled ? labelEnabled : labelDisabled,
        inline: true,
      },
      {
        name: fieldMentionRole,
        value: config.mentionRoleId ? `<@&${config.mentionRoleId}>` : labelNone,
        inline: true,
      },
      {
        name: fieldMentionUsers,
        value:
          config.mentionUserIds && config.mentionUserIds.length > 0
            ? config.mentionUserIds.map((id: string) => `<@${id}>`).join(", ")
            : labelNone,
        inline: false,
      },
    ],
  });

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * メンション削除処理
 */
async function handleRemoveMention(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも ManageGuild 権限を再検証（権限変更や想定外経路に備える）
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new ValidationError(
      await tGuild(guildId, "errors:permission.manage_guild_required"),
    );
  }

  const target = interaction.options.getString(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.TARGET,
    true,
  );
  // target は SlashCommand の choices で制約済み
  // 以降の分岐は choices と 1:1 対応させて動作差異を作らない
  const bumpReminderConfigService = getBumpReminderConfigService();
  const currentConfig =
    await bumpReminderConfigService.getBumpReminderConfig(guildId);
  // UI選択削除は現在状態を基準に行うため事前スナップショットを受け取る
  const successTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.success_title",
  );
  // remove 系は同一タイトルを使って設定変更操作として一貫表示する

  switch (target) {
    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ROLE: {
      // ロール設定を削除
      const result = await bumpReminderConfigService.setBumpReminderMentionRole(
        guildId,
        undefined,
      );
      if (result === BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED) {
        throw new ValidationError(
          await tGuild(
            guildId,
            "commands:bump-reminder-config.embed.not_configured",
          ),
        );
      }

      const roleDescription = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.remove_mention_role",
      );
      const roleEmbed = createSuccessEmbed(roleDescription, {
        title: successTitle,
      });
      await interaction.reply({
        embeds: [roleEmbed],
        flags: MessageFlags.Ephemeral,
      });
      // ROLE 削除は単一操作のため即時監査ログを残す
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      // ROLE はここで処理完了
      break;
    }

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USER:
      // ユーザー選択UIを表示（ログは handleUserSelectionUI 内で成功時のみ記録）
      // 単一選択ではなく複数選択UIで対象をまとめて削除する
      // USER だけ対話式にすることで誤削除時の確認コストを下げる
      await handleUserSelectionUI(interaction, guildId, currentConfig);
      break;

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USERS: {
      // 全ユーザー削除
      const result =
        await bumpReminderConfigService.clearBumpReminderMentionUsers(guildId);
      if (result === BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.NOT_CONFIGURED) {
        throw new ValidationError(
          await tGuild(
            guildId,
            "commands:bump-reminder-config.embed.not_configured",
          ),
        );
      }

      const usersDescription = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.remove_mention_users",
      );
      const usersEmbed = createSuccessEmbed(usersDescription, {
        title: successTitle,
      });
      await interaction.reply({
        embeds: [usersEmbed],
        flags: MessageFlags.Ephemeral,
      });
      // USERS は一括削除のため target=users を明示して追跡可能にする
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      // USERS はここで処理完了
      break;
    }

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ALL: {
      // ロール＋全ユーザー削除
      const result =
        await bumpReminderConfigService.clearBumpReminderMentions(guildId);
      if (result === BUMP_REMINDER_MENTION_CLEAR_RESULT.NOT_CONFIGURED) {
        throw new ValidationError(
          await tGuild(
            guildId,
            "commands:bump-reminder-config.embed.not_configured",
          ),
        );
      }

      const allDescription = await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.remove_mention_all",
      );
      const allEmbed = createSuccessEmbed(allDescription, {
        title: successTitle,
      });
      await interaction.reply({
        embeds: [allEmbed],
        flags: MessageFlags.Ephemeral,
      });
      // ALL は role + users を同時に消す経路として別 target で記録
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      // ALL はここで処理完了
      break;
    }
  }
}

/**
 * ユーザー選択UI処理
 */
async function handleUserSelectionUI(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  currentConfig: BumpReminderConfig | null,
): Promise<void> {
  const mentionUserIds = currentConfig?.mentionUserIds ?? [];

  // ユーザーが登録されていない場合
  if (mentionUserIds.length === 0) {
    // UI表示前に空配列を弾き、選択不能状態を避ける
    const title = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.remove_mention_error_title",
    );
    const description = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.remove_mention_error_no_users",
    );
    const embed = createErrorEmbed(description, { title });
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Discord の SelectMenu はオプション数が最大 25 件に制限されているため切り詰める
  const SELECT_MENU_OPTION_LIMIT = 25;
  const displayedUserIds = mentionUserIds.slice(0, SELECT_MENU_OPTION_LIMIT);
  // 上限超過分は UI で提示しない（Discord 制約に合わせる）

  // メンションユーザーの表示名を取得してSelectMenuのオプションを構築
  const memberOptions = await Promise.all(
    displayedUserIds.map(async (userId: string) => {
      const member = await interaction.guild?.members
        .fetch(userId)
        .catch(() => null);
      // 優先順位: サーバーニックネーム → ユーザー名 → ID
      const displayName =
        member?.displayName ?? member?.user.username ?? userId;
      return {
        label: displayName.slice(0, 100), // Discord の 100文字制限に対応
        description: `ID: ${userId}`,
        value: userId,
      };
    }),
  );
  // member 取得失敗時でも userId 表示で選択不能化を避ける

  // StringSelectMenuを作成
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(
      `${BUMP_REMINDER_CONFIG_COMMAND.CUSTOM_ID_PREFIX.REMOVE_USERS}${guildId}`,
    )
    .setPlaceholder(
      await tGuild(
        guildId,
        "commands:bump-reminder-config.embed.select_users_to_remove",
      ),
    )
    .setMinValues(1)
    .setMaxValues(displayedUserIds.length)
    .addOptions(memberOptions);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu,
  );

  const prompt = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.select_users_to_remove",
  );
  const response = await interaction.reply({
    content: prompt,
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
  // 以降の選択操作はこの返信メッセージに紐づくコンポーネントで待機
  // command reply を起点に collector を張ることで他メッセージの select を誤取得しない

  // インタラクションを待機（30秒）
  try {
    // 同一ユーザー・同一customIdのみ受理して誤操作を防ぐ
    const selectInteraction = await response.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) =>
        i.customId ===
          `${BUMP_REMINDER_CONFIG_COMMAND.CUSTOM_ID_PREFIX.REMOVE_USERS}${guildId}` &&
        i.user.id === interaction.user.id,
      time: 30000, // 30秒（ユーザーが選択するのに十分な時間）
    });

    const selectedUserIds = selectInteraction.values;
    // 選択結果を基に remove API を順次実行
    const bumpReminderConfigService = getBumpReminderConfigService();
    let removedCount = 0;

    // 選択済みユーザーを順に削除し、実際に削除できた件数を集計
    for (const userId of selectedUserIds) {
      const result =
        await bumpReminderConfigService.removeBumpReminderMentionUser(
          guildId,
          userId,
        );
      if (result === BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED) {
        removedCount++;
      }
    }
    // remove API の戻り値で実削除件数を算出し、表示件数を過大にしない

    const description = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.remove_mention_select",
      {
        // 実際に選択された対象をメンション一覧として表示
        users: selectedUserIds.map((id: string) => `<@${id}>`).join("\n"),
      },
    );
    const successTitle = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.success_title",
    );
    const embed = createSuccessEmbed(description, { title: successTitle });
    await selectInteraction.update({
      content: "",
      embeds: [embed],
      components: [],
    });
    // 完了後に components を空にして多重送信を防ぐ

    logger.info(
      // 実削除件数を監査ログへ残す
      tDefault("system:log.bump_reminder_users_removed", {
        guildId,
        count: removedCount,
      }),
    );
  } catch (error) {
    // Discord API エラー（ネットワーク障害等）は上位に再スローして統一エラーハンドラに委譲
    if (error instanceof DiscordAPIError) {
      throw error;
    }
    // awaitMessageComponent は time 切れ時に "reason: time" を含む Error をスローする。
    // それ以外の予期しないエラーは再スロー。
    // ※以前の実装では code === "InteractionCollectorError" チェックを行っていたが、
    //   discord.js は実際にこの code をセットしないため常に false となる dead code だった。
    //   また message.includes("time") は "time" を含む無関係なエラーまで捕捉する恐れがあるため、
    //   より具体的なメッセージマッチに修正した。
    if (error instanceof Error && !error.message.includes("reason: time")) {
      // タイムアウト以外の予期しないエラーは再スロー
      throw error;
    }
    // セレクトメニューのコレクタータイムアウト
    // 操作UIのみ閉じ、コマンド自体の失敗にはしない
    await interaction.editReply({
      content: await tGuild(guildId, "errors:interaction.timeout"),
      components: [],
    });
  }
}
