// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.removeMention.ts
// bump-reminder-config remove-mention 実行処理

import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  DiscordAPIError,
  MessageFlags,
  StringSelectMenuBuilder,
} from "discord.js";
import { ValidationError } from "../../../../shared/errors/customErrors";
import {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  type BumpReminderConfig,
} from "../../../../shared/features/bump-reminder/bumpReminderConfigService";
import { tDefault, tGuild } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { getBotBumpReminderConfigService } from "../../../services/botBumpReminderDependencyResolver";
import {
  createErrorEmbed,
  createSuccessEmbed,
} from "../../../utils/messageResponse";
import { BUMP_REMINDER_CONFIG_COMMAND } from "./bumpReminderConfigCommand.constants";
import { ensureManageGuildPermission } from "./bumpReminderConfigCommand.guard";

/**
 * メンション設定を削除する
 * target に応じて role / user / users / all を分岐する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleBumpReminderConfigRemoveMention(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureManageGuildPermission(interaction, guildId);

  const target = interaction.options.getString(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.TARGET,
    true,
  );
  const bumpReminderConfigService = getBotBumpReminderConfigService();
  const currentConfig =
    await bumpReminderConfigService.getBumpReminderConfig(guildId);
  const successTitle = await tGuild(
    guildId,
    "commands:bump-reminder-config.embed.success_title",
  );

  // target ごとに削除処理を実行
  switch (target) {
    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ROLE: {
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
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      break;
    }

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USER:
      // user は選択UIで削除対象を選ばせる
      await handleUserSelectionUI(interaction, guildId, currentConfig);
      break;

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.USERS: {
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
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      break;
    }

    case BUMP_REMINDER_CONFIG_COMMAND.TARGET_VALUE.ALL: {
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
      logger.info(
        tDefault("system:log.bump_reminder_mention_removed", {
          guildId,
          target,
        }),
      );
      break;
    }
  }
}

/**
 * USER target 用の選択UIを表示し、選択されたユーザーを削除する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @param currentConfig 現在のBumpリマインダー設定（ユーザー一覧参照に使用）
 * @returns 実行完了を示す Promise
 */
async function handleUserSelectionUI(
  interaction: ChatInputCommandInteraction,
  guildId: string,
  currentConfig: BumpReminderConfig | null,
): Promise<void> {
  const mentionUserIds = currentConfig?.mentionUserIds ?? [];

  // メンションユーザー未設定時はUIを出さずに案内を返す
  if (mentionUserIds.length === 0) {
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

  // Discord SelectMenu 上限（25件）に合わせて切り詰め
  const SELECT_MENU_OPTION_LIMIT = 25;
  const displayedUserIds = mentionUserIds.slice(0, SELECT_MENU_OPTION_LIMIT);

  const memberOptions = await Promise.all(
    displayedUserIds.map(async (userId: string) => {
      const member = await interaction.guild?.members
        .fetch(userId)
        .catch(() => null);
      const displayName =
        member?.displayName ?? member?.user.username ?? userId;
      return {
        label: displayName.slice(0, 100),
        description: `ID: ${userId}`,
        value: userId,
      };
    }),
  );

  // ユーザー選択メニューを構築
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

  try {
    // 同一ユーザー操作のみ受理して誤操作を防ぐ
    const selectInteraction = await response.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) =>
        i.customId ===
          `${BUMP_REMINDER_CONFIG_COMMAND.CUSTOM_ID_PREFIX.REMOVE_USERS}${guildId}` &&
        i.user.id === interaction.user.id,
      time: 30000,
    });

    const selectedUserIds = selectInteraction.values;
    const bumpReminderConfigService = getBotBumpReminderConfigService();
    let removedCount = 0;

    // 選択されたユーザーを順次削除
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

    // 削除結果をまとめて返信
    const description = await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.remove_mention_select",
      {
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

    // 監査用ログ
    logger.info(
      tDefault("system:log.bump_reminder_users_removed", {
        guildId,
        count: removedCount,
      }),
    );
  } catch (error) {
    // API系は上位へ、タイムアウトはUIクローズで扱う
    if (error instanceof DiscordAPIError) {
      throw error;
    }
    if (error instanceof Error && !error.message.includes("reason: time")) {
      throw error;
    }
    await interaction.editReply({
      content: await tGuild(guildId, "errors:interaction.timeout"),
      components: [],
    });
  }
}
