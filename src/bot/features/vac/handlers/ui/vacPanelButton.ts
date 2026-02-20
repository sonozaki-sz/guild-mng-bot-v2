// src/bot/features/vac/handlers/ui/vacPanelButton.ts
// VAC操作パネルのボタン処理

import {
  ActionRowBuilder,
  ChannelType,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  type ButtonInteraction,
  type GuildMember,
} from "discord.js";
import type { ButtonHandler } from "../../../../handlers/interactionCreate/ui";
import {
  isManagedVacChannel,
  tGuild,
} from "../../../../services/shared-access";
import { safeReply } from "../../../../utils/interaction";
import {
  createErrorEmbed,
  createSuccessEmbed,
} from "../../../../utils/messageResponse";
import {
  getVacPanelChannelId,
  sendVacControlPanel,
  VAC_PANEL_CUSTOM_ID,
} from "./vacControlPanel";

export const vacPanelButtonHandler: ButtonHandler = {
  /**
   * ハンドラー対象の customId かを判定する
   * @param customId 判定対象の customId
   * @returns VAC パネルボタンなら true
   */
  matches(customId) {
    // VAC パネル由来の4系統ボタンのみを受理
    return (
      customId.startsWith(VAC_PANEL_CUSTOM_ID.RENAME_BUTTON_PREFIX) ||
      customId.startsWith(VAC_PANEL_CUSTOM_ID.LIMIT_BUTTON_PREFIX) ||
      customId.startsWith(VAC_PANEL_CUSTOM_ID.AFK_BUTTON_PREFIX) ||
      customId.startsWith(VAC_PANEL_CUSTOM_ID.REFRESH_BUTTON_PREFIX)
    );
  },

  /**
   * VAC パネルのボタン操作を実行する
   * @param interaction ボタンインタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: ButtonInteraction) {
    // interaction に guild がないケース（DM等）は対象外
    const guild = interaction.guild;
    if (!guild) {
      return;
    }

    // ボタン customId から操作対象 VC を抽出
    const channelId = getPanelChannelId(interaction.customId);
    if (!channelId) {
      // customId 不整合時は何も返さず安全側で終了
      // エラーレスポンスを返さないことで未知ID連打時のノイズを抑える
      return;
    }

    // 対象チャンネルが存在し、かつ VoiceChannel であることを検証
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            await tGuild(guild.id, "errors:vac.not_vac_channel"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // VAC 管理対象チャンネルかを検証
    const isManaged = await isManagedVacChannel(guild.id, channel.id);
    if (!isManaged) {
      // 操作対象が通常VCだった場合は VAC 専用エラーで統一
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            await tGuild(guild.id, "errors:vac.not_vac_channel"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 操作者が対象 VC に接続中かを検証
    const member = (await guild.members
      .fetch(interaction.user.id)
      .catch(() => null)) as GuildMember | null;

    if (!member || member.voice.channelId !== channel.id) {
      // パネルの誤操作を防ぐため、同一VC参加者のみに限定
      // VC外ユーザーには操作内容を隠し、汎用エラーのみ返す
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(await tGuild(guild.id, "errors:vac.not_in_vc")),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // チャンネル名変更モーダルを表示
    if (
      interaction.customId.startsWith(VAC_PANEL_CUSTOM_ID.RENAME_BUTTON_PREFIX)
    ) {
      // rename は入力前に modal へ遷移して値検証を後段に委譲
      // ボタン段階では対象確定のみ行い、文言/長さ検証は modal 側へ集約
      const title = await tGuild(guild.id, "commands:vac.panel.rename_button");
      // rename はモーダル入力（短文）でのみ受け付ける
      const modal = new ModalBuilder()
        .setCustomId(`${VAC_PANEL_CUSTOM_ID.RENAME_MODAL_PREFIX}${channel.id}`)
        .setTitle(title)
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId(VAC_PANEL_CUSTOM_ID.RENAME_INPUT)
              .setLabel(title)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(100),
          ),
        );

      await interaction.showModal(modal);
      // モーダル表示で処理完了（以降は modal ハンドラーへ委譲）
      return;
    }

    // ユーザー上限変更モーダルを表示
    if (
      interaction.customId.startsWith(VAC_PANEL_CUSTOM_ID.LIMIT_BUTTON_PREFIX)
    ) {
      // limit も modal 側で数値範囲チェックを実施する
      // ここでは入力UI提示のみに責務を限定し、判定分岐を減らす
      const title = await tGuild(guild.id, "commands:vac.panel.limit_button");
      // limit もモーダル入力経由で受け取り、後段で数値検証する
      const modal = new ModalBuilder()
        .setCustomId(`${VAC_PANEL_CUSTOM_ID.LIMIT_MODAL_PREFIX}${channel.id}`)
        .setTitle(title)
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId(VAC_PANEL_CUSTOM_ID.LIMIT_INPUT)
              .setLabel(title)
              .setPlaceholder("0-99")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMaxLength(2),
          ),
        );

      await interaction.showModal(modal);
      // モーダル表示で処理完了（以降は modal ハンドラーへ委譲）
      return;
    }

    // AFK 移動対象ユーザー選択メニューを返信
    if (
      interaction.customId.startsWith(VAC_PANEL_CUSTOM_ID.AFK_BUTTON_PREFIX)
    ) {
      // 実行時点の接続人数に合わせて選択上限を調整
      const selectMenu = new UserSelectMenuBuilder()
        .setCustomId(`${VAC_PANEL_CUSTOM_ID.AFK_SELECT_PREFIX}${channel.id}`)
        .setPlaceholder(await tGuild(guild.id, "commands:vac.panel.afk_button"))
        .setMinValues(1)
        // Discord 上限(25)と現在接続人数から選択可能数を決定
        .setMaxValues(Math.min(25, Math.max(1, channel.members.size)));
      // members.size が 0 でも UI 破綻しないよう最小1を保証

      await safeReply(interaction, {
        components: [
          new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
            selectMenu,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      // 選択メニュー送信後の処理は userSelect handler に委譲
      // セレクトUI返信で処理完了（以降は userSelect ハンドラーへ委譲）
      return;
    }

    // 既存パネルを置き換えて再送し、完了通知を返す
    if (
      interaction.customId.startsWith(VAC_PANEL_CUSTOM_ID.REFRESH_BUTTON_PREFIX)
    ) {
      // 古いパネルを消し、同チャンネル最下部へ新規パネルを再配置
      if (interaction.message.deletable) {
        // 削除失敗でも再送自体は継続し、操作不能状態を避ける
        await interaction.message.delete().catch(() => null);
      }
      // delete 可否に関わらず再送して、常に最新構成のパネルを再配置する
      await sendVacControlPanel(channel);

      // リフレッシュ完了を操作ユーザーへ通知
      await safeReply(interaction, {
        embeds: [
          createSuccessEmbed(
            await tGuild(guild.id, "commands:vac.embed.panel_refreshed"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

/**
 * ボタン customId から VAC 対象チャンネル ID を解決する関数
 * @param customId 解析対象の customId
 * @returns 解決したチャンネルID（未対応時は空文字）
 */
function getPanelChannelId(customId: string): string {
  // rename 系ボタン
  if (customId.startsWith(VAC_PANEL_CUSTOM_ID.RENAME_BUTTON_PREFIX)) {
    return getVacPanelChannelId(
      customId,
      VAC_PANEL_CUSTOM_ID.RENAME_BUTTON_PREFIX,
    );
  }
  // limit 系ボタン
  if (customId.startsWith(VAC_PANEL_CUSTOM_ID.LIMIT_BUTTON_PREFIX)) {
    return getVacPanelChannelId(
      customId,
      VAC_PANEL_CUSTOM_ID.LIMIT_BUTTON_PREFIX,
    );
  }
  // afk 系ボタン
  if (customId.startsWith(VAC_PANEL_CUSTOM_ID.AFK_BUTTON_PREFIX)) {
    return getVacPanelChannelId(
      customId,
      VAC_PANEL_CUSTOM_ID.AFK_BUTTON_PREFIX,
    );
  }
  // refresh 系ボタン
  if (customId.startsWith(VAC_PANEL_CUSTOM_ID.REFRESH_BUTTON_PREFIX)) {
    return getVacPanelChannelId(
      customId,
      VAC_PANEL_CUSTOM_ID.REFRESH_BUTTON_PREFIX,
    );
  }
  return "";
}
