// src/bot/features/sticky-message/commands/usecases/stickyMessageSet.ts
// sticky-message set ユースケース

import {
  ChannelType,
  type ChatInputCommandInteraction,
  MessageFlags,
  type TextChannel,
} from "discord.js";
import { ValidationError } from "../../../../../shared/errors/customErrors";
import { tDefault } from "../../../../../shared/locale/localeManager";
import { logger } from "../../../../../shared/utils/logger";
import { getBotStickyMessageRepository } from "../../../../services/botStickyMessageDependencyResolver";
import {
  createSuccessEmbed,
  createWarningEmbed,
} from "../../../../utils/messageResponse";
import {
  buildStickyMessagePayload,
  type StickyEmbedData,
} from "../../services/stickyMessagePayloadBuilder";
import { STICKY_MESSAGE_COMMAND } from "../stickyMessageCommand.constants";

/**
 * sticky-message set を実行する
 */
export async function handleStickyMessageSet(
  interaction: ChatInputCommandInteraction,
  guildId: string,
): Promise<void> {
  const channelOption = interaction.options.getChannel(
    STICKY_MESSAGE_COMMAND.OPTION.CHANNEL,
    true,
  );

  if (channelOption.type !== ChannelType.GuildText) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          tDefault("commands:sticky-message.errors.text_channel_only"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const repository = getBotStickyMessageRepository();

  // 既存設定チェック
  const existing = await repository.findByChannel(channelOption.id);
  if (existing) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          tDefault("commands:sticky-message.set.alreadyExists.description"),
          { title: tDefault("commands:sticky-message.set.alreadyExists.title") },
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const messageText = interaction.options.getString(
    STICKY_MESSAGE_COMMAND.OPTION.MESSAGE,
  );
  const useEmbed =
    (interaction.options.getBoolean(STICKY_MESSAGE_COMMAND.OPTION.USE_EMBED) ??
      false);
  const embedTitle = interaction.options.getString(
    STICKY_MESSAGE_COMMAND.OPTION.EMBED_TITLE,
  );
  const embedDescription = interaction.options.getString(
    STICKY_MESSAGE_COMMAND.OPTION.EMBED_DESCRIPTION,
  );
  const embedColorStr = interaction.options.getString(
    STICKY_MESSAGE_COMMAND.OPTION.EMBED_COLOR,
  );

  // コンテンツの決定
  const content = messageText ?? embedDescription ?? embedTitle ?? "";

  if (!content.trim()) {
    await interaction.reply({
      embeds: [
        createWarningEmbed(
          tDefault("commands:sticky-message.errors.emptyMessage"),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Embed データの生成
  let embedData: string | undefined;
  if (useEmbed || embedTitle || embedDescription || embedColorStr) {
    const embedPayload: StickyEmbedData = {
      title: embedTitle ?? undefined,
      description: embedDescription ?? content,
      color: parseColor(embedColorStr),
    };
    embedData = JSON.stringify(embedPayload);
  }

  // Guild テキストチャンネル取得
  const textChannel = interaction.guild?.channels.cache.get(
    channelOption.id,
  ) as TextChannel | undefined;
  if (!textChannel) {
    throw new ValidationError(
      tDefault("commands:sticky-message.errors.text_channel_only"),
    );
  }

  try {
    // DB に保存
    const stickyRecord = await repository.create(
      guildId,
      channelOption.id,
      content,
      embedData,
    );

    // チャンネルに実際にメッセージを送信
    const sendPayload = buildStickyMessagePayload(stickyRecord);
    const sent = await textChannel.send(sendPayload);

    // lastMessageId を更新
    await repository.updateLastMessageId(stickyRecord.id, sent.id);

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          tDefault("commands:sticky-message.set.success.description"),
          { title: tDefault("commands:sticky-message.set.success.title") },
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    logger.error("Failed to set sticky message", {
      channelId: channelOption.id,
      err,
    });
    throw err;
  }
}

/**
 * カラーコード文字列を数値に変換する（失敗時は Discord Blurple）
 */
function parseColor(colorStr: string | null): number {
  if (!colorStr) return 0x5865f2;
  const normalized = colorStr.startsWith("#")
    ? colorStr.slice(1)
    : colorStr.startsWith("0x") || colorStr.startsWith("0X")
      ? colorStr.slice(2)
      : colorStr;
  const parsed = parseInt(normalized, 16);
  return isNaN(parsed) ? 0x5865f2 : parsed;
}
