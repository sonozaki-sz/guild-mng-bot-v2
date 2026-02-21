// src/bot/features/bump-reminder/handlers/ui/bumpPanelButtonHandler.ts
// Bumpパネルのボタン処理

import { MessageFlags, type ButtonInteraction } from "discord.js";
import {
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
} from "../../../../../shared/features/bump-reminder";
import { getGuildTranslator, tDefault } from "../../../../../shared/locale";
import { logger } from "../../../../../shared/utils";
import type { ButtonHandler } from "../../../../handlers/interactionCreate/ui";
import { safeReply } from "../../../../utils/interaction";
import {
  createErrorEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import {
  BUMP_CONSTANTS,
  getBumpReminderFeatureConfigService,
} from "../../index";

// Bump パネル操作のログ文言を一貫化するための定数
const BUMP_PANEL_LOG_CONSTANTS = {
  // 追加/解除の最終結果ログで共通利用する定型文
  ACTION_PREFIX: "Bump mention",
  ACTION_FOR_USER: "for user",
  ACTION_IN_GUILD: "in guild",
  // 失敗時ログ（処理本体 / エラー返信）
  HANDLE_FAILED: "Failed to handle bump panel button",
  REPLY_FAILED: "Failed to send error reply",
} as const;

// Bump パネルの ON/OFF ボタン操作を処理する UI ハンドラー
export const bumpPanelButtonHandler: ButtonHandler = {
  /**
   * ハンドラー対象の customId かを判定する
   * @param customId 判定対象の customId
   * @returns Bump パネル ON/OFF ボタンなら true
   */
  matches(customId: string) {
    // パネルの ON/OFF customId プレフィックスのみを処理対象とする
    // 設定UI以外のボタンと衝突しないよう prefix で厳密判定する
    return (
      customId.startsWith(BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_ON) ||
      customId.startsWith(BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_OFF)
    );
  },

  /**
   * Bump パネルの ON/OFF ボタン操作を実行する
   * @param interaction ボタンインタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: ButtonInteraction) {
    try {
      const customId = interaction.customId;
      // customId プレフィックスで「追加/解除」操作を判定
      const isAdding = customId.startsWith(
        BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_ON,
      );
      const prefix = isAdding
        ? BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_ON
        : BUMP_CONSTANTS.CUSTOM_ID_PREFIX.MENTION_OFF;
      // customId の残部を対象 guildId として取り出す
      // prefix は ON/OFF のどちらかなので slice 結果は常に guildId になる
      // guildId を customId に含めることで cross-guild 誤操作を抑制
      // guildId は文字列比較にのみ使い、DBキーとしては service 側で検証する
      const guildId = customId.slice(prefix.length);

      // 他ギルド由来のボタン再利用を防止
      if (!interaction.guild || interaction.guild.id !== guildId) {
        // customId の guild と実行 guild が一致しない操作は拒否
        await safeReply(interaction, {
          content: tDefault("events:bump-reminder.panel.error"),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const bumpReminderConfigService = getBumpReminderFeatureConfigService();
      const userId = interaction.user.id;
      // サービス呼び出しは guild + user 単位で完結
      // ギルドロケールに固定した翻訳関数を取得
      const tGuild = await getGuildTranslator(guildId);
      // 成功系レスポンスで使う共通タイトル
      const successTitle = tGuild("events:bump-reminder.panel.success_title");
      // 追加/解除で同一タイトルを使い、結果表示の認知負荷を下げる
      // 文言差分は本文のみへ閉じ込め、タイトル表記のぶれを防ぐ

      if (isAdding) {
        // 参加ユーザーをメンション対象へ追加
        // add/remove いずれも同一サービスAPIで結果コードを判定する
        const result =
          await bumpReminderConfigService.addBumpReminderMentionUser(
            guildId,
            userId,
          );

        if (result === BUMP_REMINDER_MENTION_USER_ADD_RESULT.NOT_CONFIGURED) {
          // 設定未初期化時は詳細を返さず汎用エラーで統一
          await safeReply(interaction, {
            content: tDefault("events:bump-reminder.panel.error"),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        if (result === BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS) {
          // 二重追加は警告のみ返し、状態変更は行わない
          // 冪等操作として成功扱いにはせず、利用者へ現状を明示する
          // 誤連打時にも操作結果を明示しつつ DB 書き込みを回避する
          await safeReply(interaction, {
            embeds: [
              createWarningEmbed(
                tGuild("events:bump-reminder.panel.already_added"),
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // 追加完了を Ephemeral で本人へ通知
        // パネル操作は公開チャンネルを汚さないよう常にEphemeral応答
        await safeReply(interaction, {
          embeds: [
            createSuccessEmbed(
              tGuild("events:bump-reminder.panel.mention_added", {
                user: `<@${userId}>`,
              }),
              { title: successTitle },
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        // 参加ユーザーをメンション対象から削除
        const result =
          await bumpReminderConfigService.removeBumpReminderMentionUser(
            guildId,
            userId,
          );

        if (
          result === BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_CONFIGURED
        ) {
          // 設定未初期化時のレスポンス方針は追加時と同じ
          // 設定未初期化時は詳細を返さず汎用エラーで統一
          await safeReply(interaction, {
            content: tDefault("events:bump-reminder.panel.error"),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        if (result === BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_FOUND) {
          // 未登録ユーザーの解除要求は警告で案内
          // 既に解除済みの再押下でもエラー化せず案内だけ返す
          // 利用者には「現状維持」を伝え、内部状態の詳細は露出しない
          await safeReply(interaction, {
            embeds: [
              createWarningEmbed(
                tGuild("events:bump-reminder.panel.not_in_list"),
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        // 削除完了を Ephemeral で本人へ通知
        // 公開チャンネルへは副作用を出さず、操作者にのみ結果を返す
        await safeReply(interaction, {
          embeds: [
            createSuccessEmbed(
              tGuild("events:bump-reminder.panel.mention_removed", {
                user: `<@${userId}>`,
              }),
              { title: successTitle },
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      logger.debug(
        // 操作結果を guild/user 単位で追跡可能な形式で記録
        `${BUMP_PANEL_LOG_CONSTANTS.ACTION_PREFIX} ${
          isAdding
            ? BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED
            : BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED
        } ${BUMP_PANEL_LOG_CONSTANTS.ACTION_FOR_USER} ${userId} ${BUMP_PANEL_LOG_CONSTANTS.ACTION_IN_GUILD} ${guildId}`,
      );
    } catch (error) {
      // 想定外エラーはログ化し、ユーザーには汎用エラーを返す
      // safeReply 失敗時の二次例外も握りつぶさず別ログへ送る
      logger.error(BUMP_PANEL_LOG_CONSTANTS.HANDLE_FAILED, error);
      try {
        await safeReply(interaction, {
          embeds: [
            createErrorEmbed(tDefault("events:bump-reminder.panel.error"), {
              title: tDefault("errors:general.error_title"),
            }),
          ],
          flags: MessageFlags.Ephemeral,
        });
      } catch (replyError) {
        logger.error(BUMP_PANEL_LOG_CONSTANTS.REPLY_FAILED, replyError);
      }
    }
  },
};
