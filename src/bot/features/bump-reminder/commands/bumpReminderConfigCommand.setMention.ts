// src/bot/features/bump-reminder/commands/bumpReminderConfigCommand.setMention.ts
// bump-reminder-config set-mention 実行処理

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { ValidationError } from "../../../../shared/errors";
import {
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
} from "../../../../shared/features/bump-reminder";
import { tDefault, tGuild } from "../../../../shared/locale";
import { logger } from "../../../../shared/utils";
import { createSuccessEmbed } from "../../../utils/messageResponse";
import { getBumpReminderFeatureConfigService } from "../services";
import { BUMP_REMINDER_CONFIG_COMMAND } from "./bumpReminderConfigCommand.constants";
import { ensureManageGuildPermission } from "./bumpReminderConfigCommand.guard";

/**
 * メンション対象（role/user）を設定する
 * user は既存時にトグル削除する
 * @param interaction コマンド実行インタラクション
 * @param guildId 設定更新対象のギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleBumpReminderConfigSetMention(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // 実行時にも管理権限を確認
  await ensureManageGuildPermission(interaction, guildId);

  // role / user の指定値を取得
  const role = interaction.options.getRole(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.ROLE,
  );
  const user = interaction.options.getUser(
    BUMP_REMINDER_CONFIG_COMMAND.OPTION.USER,
  );
  const bumpReminderConfigService = getBumpReminderFeatureConfigService();
  const currentConfig =
    await bumpReminderConfigService.getBumpReminderConfig(guildId);

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
    // user は add → 既存なら remove のトグル動作
    const addResult =
      await bumpReminderConfigService.addBumpReminderMentionUser(
        guildId,
        user.id,
      );

    if (addResult === BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED) {
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
  }

  if (role) {
    // role は上書き設定
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

  // 変更内容をまとめて返信
  const embed = createSuccessEmbed(messages.join("\n"), {
    title: await tGuild(
      guildId,
      "commands:bump-reminder-config.embed.success_title",
    ),
  });
  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  // 監査用ログ
  logger.info(
    tDefault("system:log.bump_reminder_mention_set", {
      guildId,
      roleId: finalMentionRoleId || "none",
      userIds: finalMentionUserIds.join(",") || "none",
    }),
  );
}
