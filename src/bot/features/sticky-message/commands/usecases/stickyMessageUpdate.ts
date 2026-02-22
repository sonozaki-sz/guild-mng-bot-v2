// src/bot/features/sticky-message/commands/usecases/stickyMessageUpdate.ts
// sticky-message update ユースケース

import {
  ChannelType,
  type ChatInputCommandInteraction,
  MessageFlags,
  type TextChannel,
} from "discord.js";
import { tGuild } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import { getBotStickyMessageRepository } from "../../../../services/botStickyMessageDependencyResolver";
import {
  createInfoEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import {
  buildStickyMessagePayload,
  type StickyEmbedData,
} from "../../services/stickyMessagePayloadBuilder";
import { STICKY_MESSAGE_COMMAND } from "../stickyMessageCommand.constants";

/**
 * sticky-message update を実行する
 * 既存のスティッキーメッセージ内容を上書き更新する
 * @param interaction コマンド実行インタラクション
 * @param guildId 実行対象ギルドID
 * @returns 実行完了を示す Promise
 */
export async function handleStickyMessageUpdate(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  // チャンネルオプションを取得し、テキストチャンネルであることを検証する
  const channelOption = interaction.options.getChannel(
    STICKY_MESSAGE_COMMAND.OPTION.CHANNEL,
    true,
  );

  if (channelOption.type !== ChannelType.GuildText) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          await tGuild(
            guildId,
            "commands:sticky-message.errors.text_channel_only",
          ),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const repository = getBotStickyMessageRepository();

  // 既存設定の有無を確認する
  const existing = await repository.findByChannel(channelOption.id);

  if (!existing) {
    await interaction.reply({
      embeds: [
        createInfoEmbed(
          await tGuild(
            guildId,
            "commands:sticky-message.remove.notFound.description",
          ),
          {
            title: await tGuild(
              guildId,
              "commands:sticky-message.update.notFound.title",
            ),
          },
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 更新オプションを取得する
  const messageText = interaction.options.getString(
    STICKY_MESSAGE_COMMAND.OPTION.MESSAGE,
  );
  const useEmbed =
    interaction.options.getBoolean(STICKY_MESSAGE_COMMAND.OPTION.USE_EMBED) ??
    false;
  const embedTitle = interaction.options.getString(
    STICKY_MESSAGE_COMMAND.OPTION.EMBED_TITLE,
  );
  const embedDescription = interaction.options.getString(
    STICKY_MESSAGE_COMMAND.OPTION.EMBED_DESCRIPTION,
  );
  const embedColorStr = interaction.options.getString(
    STICKY_MESSAGE_COMMAND.OPTION.EMBED_COLOR,
  );

  // 何も指定されていなければエラー
  if (
    !messageText &&
    !embedTitle &&
    !embedDescription &&
    !useEmbed &&
    !embedColorStr
  ) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          await tGuild(guildId, "commands:sticky-message.errors.emptyMessage"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // 新しいコンテンツの決定（指定なしは既存値を引き継ぐ）
  const content =
    messageText ?? embedDescription ?? embedTitle ?? existing.content;

  // Embed データの生成（useEmbed または Embed オプションのいずれかが指定された場合）
  let embedData: string | null = existing.embedData;
  if (useEmbed || embedTitle || embedDescription || embedColorStr) {
    const prev = existing.embedData
      ? (JSON.parse(existing.embedData) as StickyEmbedData)
      : {};
    const updated: StickyEmbedData = {
      title: embedTitle ?? prev.title,
      description:
        embedDescription ?? messageText ?? prev.description ?? content,
      color: embedColorStr
        ? parseColor(embedColorStr)
        : (prev.color ?? 0x008969),
    };
    embedData = JSON.stringify(updated);
  } else if (messageText && !useEmbed && !existing.embedData) {
    // プレーンテキストのみ更新でかつ元々プレーン形式の場合 null のまま
    embedData = null;
  }

  try {
    // DB 更新
    const updated = await repository.updateContent(
      existing.id,
      content,
      embedData,
    );

    // 古いスティッキーメッセージをチャンネルから削除
    if (existing.lastMessageId) {
      const textChannel = interaction.guild?.channels.cache.get(
        channelOption.id,
      ) as TextChannel | undefined;
      if (textChannel) {
        try {
          const msg = await textChannel.messages.fetch(existing.lastMessageId);
          await msg.delete();
        } catch {
          // 既に削除済みは無視
        }
        // 新しい内容でスティッキーメッセージを送信
        try {
          const payload = buildStickyMessagePayload(updated);
          const sent = await textChannel.send(payload);
          await repository.updateLastMessageId(updated.id, sent.id);
        } catch (err) {
          logger.error("Failed to resend sticky message after update", {
            channelId: channelOption.id,
            err,
          });
        }
      }
    }

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          await tGuild(
            guildId,
            "commands:sticky-message.update.success.description",
          ),
          {
            title: await tGuild(
              guildId,
              "commands:sticky-message.update.success.title",
            ),
          },
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    logger.error("Failed to update sticky message", {
      channelId: channelOption.id,
      err,
    });
    throw err;
  }
}

/**
 * カラーコード文字列を数値に変換する（失敗時はスティッキーメッセージデフォルトカラー）
 * @param colorStr カラーコード文字列（`#RRGGBB` / `0xRRGGBB` / `RRGGBB` 形式）
 * @returns 数値カラーコード
 */
function parseColor(colorStr: string): number {
  const normalized = colorStr.startsWith("#")
    ? colorStr.slice(1)
    : colorStr.startsWith("0x") || colorStr.startsWith("0X")
      ? colorStr.slice(2)
      : colorStr;
  const parsed = parseInt(normalized, 16);
  return isNaN(parsed) ? 0x008969 : parsed;
}
