// src/bot/features/vac/handlers/ui/vacPanelUserSelect.ts
// VACパネルのAFK移動セレクトメニュー処理

import {
  ChannelType,
  MessageFlags,
  type GuildMember,
  type UserSelectMenuInteraction,
} from "discord.js";
import type { UserSelectHandler } from "../../../../handlers/interactionCreate/ui";
import {
  getBotGuildConfigRepository,
  isManagedVacChannel,
  tGuild,
} from "../../../../services/shared-access";
import { safeReply } from "../../../../utils/interaction";
import {
  createErrorEmbed,
  createSuccessEmbed,
} from "../../../../utils/messageResponse";
import { getVacPanelChannelId, VAC_PANEL_CUSTOM_ID } from "./vacControlPanel";

export const vacPanelUserSelectHandler: UserSelectHandler = {
  /**
   * ハンドラー対象の customId かを判定する
   * @param customId 判定対象の customId
   * @returns VAC パネルAFKセレクトなら true
   */
  matches(customId) {
    // AFK 移動セレクトメニューの customId のみを受理
    return customId.startsWith(VAC_PANEL_CUSTOM_ID.AFK_SELECT_PREFIX);
  },

  /**
   * VAC パネルの AFK ユーザー選択を処理する
   * @param interaction ユーザーセレクトインタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: UserSelectMenuInteraction) {
    // interaction に guild がないケースは処理対象外
    const guild = interaction.guild;
    if (!guild) {
      return;
    }

    // customId に埋め込まれた操作対象 VC を復元して実体を取得
    const channelId = getVacPanelChannelId(
      interaction.customId,
      VAC_PANEL_CUSTOM_ID.AFK_SELECT_PREFIX,
    );
    // channelId 不正時は fetch 失敗→下流の not_vac_channel 分岐で処理
    const channel = await guild.channels.fetch(channelId).catch(() => null);

    // 対象チャンネルが VoiceChannel であることを検証
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      // customId 改ざんや削除済みチャンネルを同一エラーで吸収
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
      // 通常VCを対象にした誤操作も同一エラーへ統一する
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
    const operator = (await guild.members
      .fetch(interaction.user.id)
      .catch(() => null)) as GuildMember | null;

    if (!operator || operator.voice.channelId !== channel.id) {
      // 操作者本人が対象VCにいない場合はAFK移動権限を与えない
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(await tGuild(guild.id, "errors:vac.not_in_vc")),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // AFK 機能が有効かつチャンネル指定済みであることを確認
    const afkConfig = await getBotGuildConfigRepository().getAfkConfig(
      guild.id,
    );
    if (!afkConfig || !afkConfig.enabled || !afkConfig.channelId) {
      // AFK 機能未設定時は選択操作を受け付けない
      // パネル側で設定変更は行わず、専用設定コマンドへ責務を分離する
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(await tGuild(guild.id, "errors:afk.not_configured")),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // AFK チャンネルの実体が VoiceChannel であることを検証
    const afkChannel = await guild.channels
      .fetch(afkConfig.channelId)
      .catch(() => null);
    // 保存設定は存在しても実チャンネルが消えている場合がある

    if (!afkChannel || afkChannel.type !== ChannelType.GuildVoice) {
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            await tGuild(guild.id, "errors:afk.channel_not_found"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 選択されたメンバーを順に AFK へ移動（対象 VC にいないユーザーはスキップ）
    let movedCount = 0;

    for (const userId of interaction.values) {
      // 選択値ごとに都度 member を引き直して最新状態で判定
      // 権限不足・離脱済みなどで取得失敗したユーザーはスキップ
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member || member.voice.channelId !== channel.id) {
        // 操作時点で対象 VC から外れているユーザーは無視
        continue;
      }
      // 1ユーザーごとの移動失敗は全体失敗にせず継続
      await member.voice.setChannel(afkChannel).catch(() => null);
      movedCount += 1;
    }
    // ベストエフォート実行とし、一部失敗でも成功件数を返す

    // 実際に移動できた人数のみを結果に反映
    // 選択人数ではなく成功件数を返して実態と表示を一致させる
    await safeReply(interaction, {
      embeds: [
        createSuccessEmbed(
          await tGuild(guild.id, "commands:vac.embed.members_moved", {
            count: String(movedCount),
          }),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
    // 0件でも成功応答を返し、操作完了を明示する
  },
};
