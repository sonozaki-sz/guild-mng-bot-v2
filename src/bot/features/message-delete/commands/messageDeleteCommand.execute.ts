// src/bot/features/message-delete/commands/messageDeleteCommand.execute.ts
// /message-delete コマンド実行処理

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
  type TextChannel,
} from "discord.js";
import { tDefault } from "../../../../shared/locale/localeManager";
import { logger } from "../../../../shared/utils/logger";
import { handleCommandError } from "../../../errors/interactionErrorHandler";
import { getBotMessageDeleteUserSettingService } from "../../../services/botMessageDeleteDependencyResolver";
import {
  createErrorEmbed,
  createInfoEmbed,
  createWarningEmbed,
} from "../../../utils/messageResponse";
import {
  MSG_DEL_CONFIRM_TIMEOUT_MS,
  MSG_DEL_CUSTOM_ID,
  MSG_DEL_PAGE_SIZE,
  MSG_DEL_PAGINATION_TIMEOUT_MS,
  type DeletedMessageRecord,
  type MessageDeleteFilter,
} from "../constants/messageDeleteConstants";
import { deleteMessages, parseDateStr } from "../services/messageDeleteService";
import {
  buildDetailEmbed,
  buildFilteredRecords,
  buildPaginationComponents,
  buildSummaryEmbed,
} from "./messageDeleteEmbedBuilder";

/**
 * /message-delete コマンド実行処理
 */
export async function executeMessageDeleteCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    logger.debug("[MsgDel][DBG] 1: start");
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    logger.debug("[MsgDel][DBG] 2: deferred");

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.editReply(tDefault("errors:validation.guild_only"));
      return;
    }

    // ---- オプション取得 ----
    const countOption = interaction.options.getInteger("count");
    const userInput = interaction.options.getString("user", false);
    logger.debug("[MsgDel][DBG] 3: options parsed");
    const botOption = interaction.options.getBoolean("bot", false);
    const keyword = interaction.options.getString("keyword", false);

    // ---- user オプションのパース（メンション or 生ID） ----
    let targetUserId: string | undefined;
    if (userInput) {
      const mentionMatch = userInput.match(/^<@!?(\d+)>$/);
      const rawId = mentionMatch
        ? mentionMatch[1]
        : /^\d{17,20}$/.test(userInput)
          ? userInput
          : null;
      if (!rawId) {
        await interaction.editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.user_invalid_format"),
            ),
          ],
        });
        return;
      }
      targetUserId = rawId;
    }
    const daysOption = interaction.options.getInteger("days", false);
    const afterStr = interaction.options.getString("after", false);
    const beforeStr = interaction.options.getString("before", false);
    const channelOption = interaction.options.getChannel("channel", false);

    // ---- バリデーション ----
    // フィルタ条件が何もない場合は拒否
    if (
      !countOption &&
      !targetUserId &&
      !botOption &&
      !keyword &&
      !daysOption &&
      !afterStr &&
      !beforeStr
    ) {
      await interaction.editReply({
        embeds: [
          createWarningEmbed(
            tDefault("commands:message-delete.errors.no_filter"),
          ),
        ],
      });
      return;
    }

    // days と after/before の排他チェック
    if (daysOption && (afterStr || beforeStr)) {
      await interaction.editReply({
        embeds: [
          createWarningEmbed(
            tDefault("commands:message-delete.errors.days_and_date_conflict"),
          ),
        ],
      });
      return;
    }

    // チャンネル未指定 かつ count 未指定は全チャンネル全件スキャンになるため拒否
    if (!channelOption && !countOption) {
      await interaction.editReply({
        embeds: [
          createWarningEmbed(
            tDefault("commands:message-delete.errors.no_channel_no_count"),
          ),
        ],
      });
      return;
    }

    // after・before の日付パースとバリデーション
    let afterTs = 0;
    let beforeTs = Infinity;

    if (daysOption) {
      afterTs = Date.now() - daysOption * 24 * 60 * 60 * 1000;
      beforeTs = Infinity;
    } else {
      if (afterStr) {
        const d = parseDateStr(afterStr, false);
        if (!d) {
          await interaction.editReply({
            embeds: [
              createWarningEmbed(
                tDefault("commands:message-delete.errors.after_invalid_format"),
              ),
            ],
          });
          return;
        }
        afterTs = d.getTime();
      }
      if (beforeStr) {
        const d = parseDateStr(beforeStr, true);
        if (!d) {
          await interaction.editReply({
            embeds: [
              createWarningEmbed(
                tDefault(
                  "commands:message-delete.errors.before_invalid_format",
                ),
              ),
            ],
          });
          return;
        }
        beforeTs = d.getTime();
      }
      if (afterTs !== 0 && beforeTs !== Infinity && afterTs > beforeTs) {
        await interaction.editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.date_range_invalid"),
            ),
          ],
        });
        return;
      }
    }

    // ---- 権限チェック ----
    logger.debug("[MsgDel][DBG] 4: permission check");
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.editReply({
        embeds: [
          createErrorEmbed(
            tDefault("commands:message-delete.errors.no_permission"),
          ),
        ],
      });
      return;
    }

    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply(tDefault("errors:validation.guild_only"));
      return;
    }

    // ---- 対象チャンネルリストの構築 ----
    logger.debug("[MsgDel][DBG] 5: building channel list");
    let targetChannels: GuildTextBasedChannel[];
    if (channelOption) {
      const isText =
        channelOption.type === ChannelType.GuildText ||
        channelOption.type === ChannelType.GuildAnnouncement ||
        channelOption.type === ChannelType.PublicThread ||
        channelOption.type === ChannelType.PrivateThread ||
        channelOption.type === ChannelType.GuildVoice;
      if (!isText) {
        await interaction.editReply({
          embeds: [
            createWarningEmbed(
              tDefault("commands:message-delete.errors.text_channel_only"),
            ),
          ],
        });
        return;
      }
      targetChannels = [channelOption as GuildTextBasedChannel];
    } else {
      // サーバー内の全テキストチャンネル
      logger.debug("[MsgDel][DBG] 5a: fetching all channels");
      const allChannels = await guild.channels.fetch();
      logger.debug(`[MsgDel][DBG] 5b: fetched ${allChannels.size} channels`);
      const me = guild.members.me;
      targetChannels = allChannels
        .filter(
          (ch): ch is TextChannel =>
            ch !== null &&
            ch.isTextBased() &&
            me !== null &&
            (ch
              .permissionsFor(me)
              ?.has([
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
              ]) ??
              false),
        )
        .map((ch) => ch as GuildTextBasedChannel);
    }

    // ---- 実行確認ダイアログ ----
    logger.debug("[MsgDel][DBG] 6: getting user setting");
    const settingService = getBotMessageDeleteUserSettingService();
    const { skipConfirm } = await settingService.getUserSetting(
      interaction.user.id,
      guildId,
    );
    logger.debug(`[MsgDel][DBG] 7: skipConfirm=${skipConfirm}`);

    if (!skipConfirm) {
      const conditionLines: string[] = [];
      conditionLines.push(
        tDefault("commands:message-delete.confirm.target_channel", {
          channel: channelOption
            ? `<#${channelOption.id}>`
            : tDefault("commands:message-delete.confirm.channel_all"),
        }),
      );
      conditionLines.push(
        tDefault("commands:message-delete.confirm.conditions"),
      );
      if (targetUserId)
        conditionLines.push(
          tDefault("commands:message-delete.confirm.condition_user", {
            userId: targetUserId,
          }),
        );
      if (botOption)
        conditionLines.push(
          tDefault("commands:message-delete.confirm.condition_bot"),
        );
      if (keyword)
        conditionLines.push(
          tDefault("commands:message-delete.confirm.condition_keyword", {
            keyword,
          }),
        );
      if (daysOption)
        conditionLines.push(
          tDefault("commands:message-delete.confirm.condition_days", {
            days: daysOption,
          }),
        );
      if (afterStr)
        conditionLines.push(
          tDefault("commands:message-delete.confirm.condition_after", {
            after: afterStr,
          }),
        );
      if (beforeStr)
        conditionLines.push(
          tDefault("commands:message-delete.confirm.condition_before", {
            before: beforeStr,
          }),
        );
      if (countOption)
        conditionLines.push(
          tDefault("commands:message-delete.confirm.condition_count", {
            count: countOption,
          }),
        );

      const confirmed = await showConfirmDialog(
        interaction,
        conditionLines.join("\n"),
        settingService,
        guildId,
      );
      if (!confirmed) return;
    }

    // ---- 削除処理 ----
    logger.debug("[MsgDel][DBG] 8: start deleteMessages");
    const count = countOption ?? Infinity;

    try {
      const result = await deleteMessages(targetChannels, {
        count,
        targetUserId,
        targetBot: botOption === true ? true : undefined,
        keyword: keyword ?? undefined,
        afterTs,
        beforeTs,
        onProgress: async (msg) => {
          await interaction.editReply(msg);
        },
      });

      if (result.totalDeleted === 0) {
        await interaction.editReply({
          embeds: [
            createInfoEmbed(
              tDefault("commands:message-delete.errors.no_messages_found"),
            ),
          ],
        });
        return;
      }

      // ---- 結果表示 ----
      const summaryEmbed = buildSummaryEmbed(
        result.totalDeleted,
        result.channelBreakdown,
      );

      // 1件のみの場合はボタンなし
      if (result.deletedRecords.length === 1) {
        const r = result.deletedRecords[0];
        summaryEmbed.addFields({
          name: `[1] @${r.authorTag} | #${r.channelName}`,
          value: `${r.createdAt.toLocaleString("ja-JP")}\n${r.content || tDefault("commands:message-delete.result.empty_content")}`,
        });
        await interaction.editReply({ embeds: [summaryEmbed], components: [] });
        return;
      }

      // ページネイション付き結果表示
      await sendPaginatedResult(
        interaction,
        summaryEmbed,
        result.deletedRecords,
      );

      // ---- ログ記録 ----
      const periodLabel = daysOption
        ? `days=${daysOption}`
        : [afterStr && `after=${afterStr}`, beforeStr && `before=${beforeStr}`]
            .filter(Boolean)
            .join(" ") || "";
      logger.info(
        `[MsgDel] ${interaction.user.tag} deleted ${result.totalDeleted} messages` +
          `${targetUserId ? ` target=${targetUserId}` : ""}` +
          `${botOption ? " bot=true" : ""}` +
          `${keyword ? ` keyword="${keyword}"` : ""}` +
          `${periodLabel ? ` ${periodLabel}` : ""}` +
          ` channels=[${Object.keys(result.channelBreakdown).join(", ")}]`,
      );
    } catch (error) {
      logger.error("[MsgDel] 削除処理エラー:", String(error));
      await interaction.editReply({
        embeds: [
          createErrorEmbed(
            tDefault("commands:message-delete.errors.delete_failed"),
          ),
        ],
      });
    }
  } catch (error) {
    await handleCommandError(interaction, error);
  }
}

/**
 * 実行確認ダイアログを表示し、ユーザーの応答を待つ
 * @returns `true` = 確認済み、`false` = キャンセル or タイムアウト
 */
async function showConfirmDialog(
  interaction: ChatInputCommandInteraction,
  conditionSummary: string,
  settingService: ReturnType<typeof getBotMessageDeleteUserSettingService>,
  guildId: string,
): Promise<boolean> {
  let skipNext = false; // 「次回から確認しない」トグル状態

  const buildButtons = () =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(MSG_DEL_CUSTOM_ID.CONFIRM_YES)
        .setEmoji("✅")
        .setLabel(tDefault("commands:message-delete.confirm.btn_yes"))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(MSG_DEL_CUSTOM_ID.CONFIRM_NO)
        .setEmoji("❌")
        .setLabel(tDefault("commands:message-delete.confirm.btn_no"))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(MSG_DEL_CUSTOM_ID.CONFIRM_SKIP_TOGGLE)
        .setEmoji(skipNext ? "✅" : "⬜")
        .setLabel(
          skipNext
            ? tDefault("commands:message-delete.confirm.btn_skip_toggle_on")
            : tDefault("commands:message-delete.confirm.btn_skip_toggle_off"),
        )
        .setStyle(skipNext ? ButtonStyle.Success : ButtonStyle.Secondary),
    );

  const response = await interaction.editReply({
    content: tDefault("commands:message-delete.confirm.question", {
      conditions: conditionSummary,
    }),
    components: [buildButtons()],
  });

  return new Promise((resolve) => {
    const collector = response.createMessageComponentCollector({
      time: MSG_DEL_CONFIRM_TIMEOUT_MS,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: tDefault("commands:message-delete.errors.not_authorized"),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (i.customId === MSG_DEL_CUSTOM_ID.CONFIRM_SKIP_TOGGLE) {
        skipNext = !skipNext;
        await i.update({ components: [buildButtons()] });
        return;
      }

      collector.stop(i.customId);
    });

    collector.on("end", async (_, reason) => {
      if (reason === MSG_DEL_CUSTOM_ID.CONFIRM_YES) {
        if (skipNext) {
          await settingService
            .updateUserSetting(interaction.user.id, guildId, {
              skipConfirm: true,
            })
            .catch((err: unknown) => {
              logger.warn("[MsgDel] ユーザー設定保存失敗:", String(err));
            });
        }
        resolve(true);
      } else if (reason === MSG_DEL_CUSTOM_ID.CONFIRM_NO) {
        await interaction
          .editReply({
            embeds: [
              createInfoEmbed(
                tDefault("commands:message-delete.confirm.cancelled"),
              ),
            ],
            components: [],
          })
          .catch(() => {});
        resolve(false);
      } else {
        // タイムアウト
        await interaction
          .editReply({
            embeds: [
              createWarningEmbed(
                tDefault("commands:message-delete.confirm.timed_out"),
              ),
            ],
            components: [],
          })
          .catch(() => {});
        resolve(false);
      }
    });
  });
}

/**
 * 削除済みメッセージ一覧をページネイション + フィルター付き Embed で送信する
 */
async function sendPaginatedResult(
  interaction: ChatInputCommandInteraction,
  summaryEmbed: ReturnType<typeof buildSummaryEmbed>,
  records: DeletedMessageRecord[],
): Promise<void> {
  let currentPage = 0;
  let filter: MessageDeleteFilter = {};

  const getFiltered = () => buildFilteredRecords(records, filter);

  const getComponents = (page: number) => {
    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / MSG_DEL_PAGE_SIZE);
    return buildPaginationComponents(records, page, totalPages, filter);
  };

  const filtered = getFiltered();
  const totalPages = Math.ceil(filtered.length / MSG_DEL_PAGE_SIZE);

  const response = await interaction.editReply({
    embeds: [
      summaryEmbed,
      buildDetailEmbed(filtered, currentPage, totalPages, filter),
    ],
    components: getComponents(currentPage),
    content: "",
  });

  // 15分間インタラクションを待機
  const collector = response.createMessageComponentCollector({
    time: MSG_DEL_PAGINATION_TIMEOUT_MS,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({
        embeds: [
          createErrorEmbed(
            tDefault("commands:message-delete.errors.not_authorized"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (i.customId === MSG_DEL_CUSTOM_ID.PREV) {
      currentPage = Math.max(0, currentPage - 1);
    } else if (i.customId === MSG_DEL_CUSTOM_ID.NEXT) {
      const f = getFiltered();
      const tp = Math.ceil(f.length / MSG_DEL_PAGE_SIZE);
      currentPage = Math.min(tp - 1, currentPage + 1);
    } else if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_AUTHOR) {
      // セレクトメニューからの投稿者フィルター
      if (i.isStringSelectMenu()) {
        filter = {
          ...filter,
          authorId:
            i.values.length > 0
              ? records.find((r) => r.authorTag === i.values[0])?.authorId
              : undefined,
        };
        currentPage = 0;
      }
    } else if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_RESET) {
      filter = {};
      currentPage = 0;
    } else if (
      i.customId === MSG_DEL_CUSTOM_ID.FILTER_KEYWORD ||
      i.customId === MSG_DEL_CUSTOM_ID.FILTER_DAYS ||
      i.customId === MSG_DEL_CUSTOM_ID.FILTER_AFTER ||
      i.customId === MSG_DEL_CUSTOM_ID.FILTER_BEFORE
    ) {
      // モーダルでキーワード/日付入力を受け取る
      let modalTitle = "";
      let inputCustomId = "";
      let inputLabel = "";
      let inputPlaceholder = "";

      if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_KEYWORD) {
        modalTitle = tDefault("commands:message-delete.modal.keyword.title");
        inputCustomId = MSG_DEL_CUSTOM_ID.MODAL_INPUT_KEYWORD;
        inputLabel = tDefault("commands:message-delete.modal.keyword.label");
        inputPlaceholder = tDefault(
          "commands:message-delete.modal.keyword.placeholder",
        );
      } else if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_DAYS) {
        modalTitle = tDefault("commands:message-delete.modal.days.title");
        inputCustomId = MSG_DEL_CUSTOM_ID.MODAL_INPUT_DAYS;
        inputLabel = tDefault("commands:message-delete.modal.days.label");
        inputPlaceholder = tDefault(
          "commands:message-delete.modal.days.placeholder",
        );
      } else if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_AFTER) {
        modalTitle = tDefault("commands:message-delete.modal.after.title");
        inputCustomId = MSG_DEL_CUSTOM_ID.MODAL_INPUT_AFTER;
        inputLabel = tDefault("commands:message-delete.modal.after.label");
        inputPlaceholder = tDefault(
          "commands:message-delete.modal.after.placeholder",
        );
      } else {
        modalTitle = tDefault("commands:message-delete.modal.before.title");
        inputCustomId = MSG_DEL_CUSTOM_ID.MODAL_INPUT_BEFORE;
        inputLabel = tDefault("commands:message-delete.modal.before.label");
        inputPlaceholder = tDefault(
          "commands:message-delete.modal.before.placeholder",
        );
      }

      const modal = new ModalBuilder()
        .setCustomId(
          i.customId === MSG_DEL_CUSTOM_ID.FILTER_KEYWORD
            ? MSG_DEL_CUSTOM_ID.MODAL_KEYWORD
            : i.customId === MSG_DEL_CUSTOM_ID.FILTER_DAYS
              ? MSG_DEL_CUSTOM_ID.MODAL_DAYS
              : i.customId === MSG_DEL_CUSTOM_ID.FILTER_AFTER
                ? MSG_DEL_CUSTOM_ID.MODAL_AFTER
                : MSG_DEL_CUSTOM_ID.MODAL_BEFORE,
        )
        .setTitle(modalTitle)
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId(inputCustomId)
              .setLabel(inputLabel)
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setPlaceholder(inputPlaceholder),
          ),
        );

      await i.showModal(modal);

      // モーダル送信を待機する
      const modalSubmit = await i
        .awaitModalSubmit({ time: 60_000 })
        .catch(() => null);

      if (!modalSubmit) return;

      await modalSubmit.deferUpdate();

      const value = modalSubmit.fields.getTextInputValue(inputCustomId).trim();

      if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_KEYWORD) {
        filter = { ...filter, keyword: value || undefined, days: undefined };
      } else if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_DAYS) {
        const days = parseInt(value, 10);
        if (value && (isNaN(days) || days < 1)) {
          await interaction
            .followUp({
              embeds: [
                createWarningEmbed(
                  tDefault("commands:message-delete.errors.days_invalid_value"),
                ),
              ],
              flags: MessageFlags.Ephemeral,
            })
            .catch(() => {});
          // リビルドせず return
          const f = getFiltered();
          const tp = Math.ceil(f.length / MSG_DEL_PAGE_SIZE);
          await interaction
            .editReply({
              embeds: [
                summaryEmbed,
                buildDetailEmbed(f, currentPage, tp, filter),
              ],
              components: getComponents(currentPage),
              content: "",
            })
            .catch(() => {});
          return;
        }
        filter = {
          ...filter,
          days: value ? days : undefined,
          after: undefined,
          before: undefined,
        };
        currentPage = 0;
      } else if (i.customId === MSG_DEL_CUSTOM_ID.FILTER_AFTER) {
        if (value) {
          const afterDate = parseDateStr(value, false);
          if (!afterDate) {
            await interaction
              .followUp({
                embeds: [
                  createWarningEmbed(
                    tDefault(
                      "commands:message-delete.errors.after_invalid_format",
                    ),
                  ),
                ],
                flags: MessageFlags.Ephemeral,
              })
              .catch(() => {});
            const f = getFiltered();
            const tp = Math.ceil(f.length / MSG_DEL_PAGE_SIZE);
            await interaction
              .editReply({
                embeds: [
                  summaryEmbed,
                  buildDetailEmbed(f, currentPage, tp, filter),
                ],
                components: getComponents(currentPage),
                content: "",
              })
              .catch(() => {});
            return;
          }
          // before との整合性チェック
          if (filter.before && afterDate > filter.before) {
            await interaction
              .followUp({
                embeds: [
                  createWarningEmbed(
                    tDefault(
                      "commands:message-delete.errors.date_range_invalid",
                    ),
                  ),
                ],
                flags: MessageFlags.Ephemeral,
              })
              .catch(() => {});
            const f = getFiltered();
            const tp = Math.ceil(f.length / MSG_DEL_PAGE_SIZE);
            await interaction
              .editReply({
                embeds: [
                  summaryEmbed,
                  buildDetailEmbed(f, currentPage, tp, filter),
                ],
                components: getComponents(currentPage),
                content: "",
              })
              .catch(() => {});
            return;
          }
          filter = { ...filter, after: afterDate, days: undefined };
        } else {
          filter = { ...filter, after: undefined };
        }
        currentPage = 0;
      } else {
        // FILTER_BEFORE
        if (value) {
          const beforeDate = parseDateStr(value, true);
          if (!beforeDate) {
            await interaction
              .followUp({
                embeds: [
                  createWarningEmbed(
                    tDefault(
                      "commands:message-delete.errors.before_invalid_format",
                    ),
                  ),
                ],
                flags: MessageFlags.Ephemeral,
              })
              .catch(() => {});
            const f = getFiltered();
            const tp = Math.ceil(f.length / MSG_DEL_PAGE_SIZE);
            await interaction
              .editReply({
                embeds: [
                  summaryEmbed,
                  buildDetailEmbed(f, currentPage, tp, filter),
                ],
                components: getComponents(currentPage),
                content: "",
              })
              .catch(() => {});
            return;
          }
          // after との整合性チェック
          if (filter.after && filter.after > beforeDate) {
            await interaction
              .followUp({
                embeds: [
                  createWarningEmbed(
                    tDefault(
                      "commands:message-delete.errors.date_range_invalid",
                    ),
                  ),
                ],
                flags: MessageFlags.Ephemeral,
              })
              .catch(() => {});
            const f = getFiltered();
            const tp = Math.ceil(f.length / MSG_DEL_PAGE_SIZE);
            await interaction
              .editReply({
                embeds: [
                  summaryEmbed,
                  buildDetailEmbed(f, currentPage, tp, filter),
                ],
                components: getComponents(currentPage),
                content: "",
              })
              .catch(() => {});
            return;
          }
          filter = { ...filter, before: beforeDate, days: undefined };
        } else {
          filter = { ...filter, before: undefined };
        }
        currentPage = 0;
      }

      const newFiltered = getFiltered();
      const newTp = Math.ceil(newFiltered.length / MSG_DEL_PAGE_SIZE);
      await interaction
        .editReply({
          embeds: [
            summaryEmbed,
            buildDetailEmbed(newFiltered, currentPage, newTp, filter),
          ],
          components: getComponents(currentPage),
          content: "",
        })
        .catch(() => {});
      return;
    }

    // ページ移動とフィルター（モーダル以外）のupdate
    const f = getFiltered();
    const tp = Math.ceil(f.length / MSG_DEL_PAGE_SIZE);
    // currentPage がページ範囲を超えないようにクランプ
    currentPage = Math.min(currentPage, Math.max(0, tp - 1));

    await i
      .update({
        embeds: [summaryEmbed, buildDetailEmbed(f, currentPage, tp, filter)],
        components: getComponents(currentPage),
        content: "",
      })
      .catch(() => {});
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] }).catch(() => {});
  });
}
