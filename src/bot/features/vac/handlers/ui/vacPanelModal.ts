// src/bot/features/vac/handlers/ui/vacPanelModal.ts
// VAC操作パネルのモーダル処理

import {
  ChannelType,
  MessageFlags,
  type GuildMember,
  type ModalSubmitInteraction,
} from "discord.js";
import type { ModalHandler } from "../../../../handlers/interactionCreate/ui";
import {
  isManagedVacChannel,
  tGuild,
} from "../../../../services/shared-access";
import { safeReply } from "../../../../utils/interaction";
import {
  createErrorEmbed,
  createSuccessEmbed,
} from "../../../../utils/messageResponse";
import { getVacPanelChannelId, VAC_PANEL_CUSTOM_ID } from "./vacControlPanel";

// Discord VC userLimit の許容範囲（0 は無制限）
const LIMIT_MIN = 0;
const LIMIT_MAX = 99;

export const vacPanelModalHandler: ModalHandler = {
  /**
   * ハンドラー対象の customId かを判定する
   * @param customId 判定対象の customId
   * @returns VAC パネルモーダルなら true
   */
  matches(customId) {
    // rename/limit の2系統モーダルのみを受理
    // customId ルーティングは interactionCreate 側の dispatch 条件と対応させる
    return (
      customId.startsWith(VAC_PANEL_CUSTOM_ID.RENAME_MODAL_PREFIX) ||
      customId.startsWith(VAC_PANEL_CUSTOM_ID.LIMIT_MODAL_PREFIX)
    );
  },

  /**
   * VAC パネルのモーダル送信を処理する
   * @param interaction モーダルインタラクション
   * @returns 実行完了を示す Promise
   */
  async execute(interaction: ModalSubmitInteraction) {
    // interaction に guild がないケースは処理対象外
    const guild = interaction.guild;
    if (!guild) {
      // DM 等の guild 非依存コンテキストでは安全に無視
      return;
    }

    // customId から対象 VC を抽出（rename / limit で prefix を切り替える）
    const isRename = interaction.customId.startsWith(
      VAC_PANEL_CUSTOM_ID.RENAME_MODAL_PREFIX,
    );
    const channelId = getVacPanelChannelId(
      interaction.customId,
      isRename
        ? VAC_PANEL_CUSTOM_ID.RENAME_MODAL_PREFIX
        : VAC_PANEL_CUSTOM_ID.LIMIT_MODAL_PREFIX,
    );
    // 不正IDは fetch 失敗後の not_vac_channel で収束させる

    // 対象チャンネルが VoiceChannel であることを検証
    // fetch 失敗（削除済み・権限不足など）も null として同一分岐に寄せる
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      // 操作対象が無効なら処理を継続しない
      // 削除済み/型不一致を同一文言へ寄せ、漏洩情報を増やさない
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

    // 操作者が対象 VC にいることを検証
    const member = (await guild.members
      .fetch(interaction.user.id)
      .catch(() => null)) as GuildMember | null;

    if (!member || member.voice.channelId !== channel.id) {
      // VC 外/別VCユーザーによる操作を拒否
      // パネルURL共有時の第三者操作をここで遮断する
      // 所有者概念ではなく「そのVCに現在いるか」を権限境界として採用
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(await tGuild(guild.id, "errors:vac.not_in_vc")),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // rename モード: 入力名を検証してチャンネル名を更新
    if (isRename) {
      // rename 経路は入力文字列の空チェックのみ行う
      // 文字数上限などは Discord 側のチャンネル編集制約に委譲する
      const newName = interaction.fields
        .getTextInputValue(VAC_PANEL_CUSTOM_ID.RENAME_INPUT)
        .trim();
      if (!newName) {
        // 空文字は無効入力として扱い、既存の汎用エラー文言で返す
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

      // チャンネル名更新を実行（権限不足時は上位で例外処理される）
      await channel.edit({ name: newName });
      await safeReply(interaction, {
        embeds: [
          createSuccessEmbed(
            await tGuild(guild.id, "commands:vac.embed.renamed", {
              name: newName,
            }),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      // rename 経路は limit 検証へ落とさず早期 return する
      // rename モードはここで処理完了
      return;
    }

    // limit モード: 数値入力を解釈して上限を更新
    // テキスト入力を整数へ変換して userLimit 用に解釈
    const rawLimit = interaction.fields
      .getTextInputValue(VAC_PANEL_CUSTOM_ID.LIMIT_INPUT)
      .trim();
    // Number(...) ではなく parseInt(..., 10) を使い 10進数として固定解釈する
    const limit = Number.parseInt(rawLimit, 10);

    if (!Number.isInteger(limit) || limit < LIMIT_MIN || limit > LIMIT_MAX) {
      // 数値化できない/範囲外入力は即時エラー応答
      await safeReply(interaction, {
        embeds: [
          createErrorEmbed(
            await tGuild(guild.id, "errors:vac.limit_out_of_range"),
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 入力検証済みの上限値で VC の userLimit を更新
    await channel.edit({ userLimit: limit });
    // 反映後の値をユーザー向け文言へ変換して返す

    // 0 は UI 表示上「無制限」として扱う
    const limitLabel =
      limit === 0
        ? await tGuild(guild.id, "commands:vac.embed.unlimited")
        : String(limit);

    await safeReply(interaction, {
      // limit 更新結果を操作ユーザーへ返す
      // 実際に反映した最終表示値（数値 or 無制限）を返す
      embeds: [
        createSuccessEmbed(
          await tGuild(guild.id, "commands:vac.embed.limit_changed", {
            limit: limitLabel,
          }),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
