// src/bot/features/vac/services/vacService.ts
// VAC機能のビジネスロジックサービス

import {
  ChannelType,
  PermissionFlagsBits,
  type Channel,
  type GuildMember,
  type VoiceState,
} from "discord.js";
import { logger } from "../../../../shared/utils";
import type { BotClient } from "../../../client";
import { tDefault } from "../../../services/shared-access";
import { sendVacControlPanel } from "../handlers/ui";
import { getVacRepository, type IVacRepository } from "../repositories";

const VAC_EVENT = {
  DEFAULT_LIMIT: 99,
  CATEGORY_CHANNEL_LIMIT: 50,
} as const;
// DEFAULT_LIMIT は初期作成時のみ利用し、後続の操作パネルで変更可能
// CATEGORY_CHANNEL_LIMIT はカテゴリ飽和時の早期打ち切り閾値

type GuildChannelsCache = GuildMember["guild"]["channels"]["cache"];

/**
 * VAC機能のユースケースを担当するサービス
 */
export class VacService {
  constructor(private readonly vacRepository: IVacRepository) {}

  /**
   * voiceStateUpdate を受け、VAC 作成/削除ユースケースを実行する
   */
  async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    try {
      // ギルド外/状態変化なしは対象外
      if (!newState.guild || oldState.channelId === newState.channelId) {
        return;
      }

      // 入室側・退室側のユースケースを順に評価
      // 同一イベント内で create/delete を直列に処理し、競合条件を減らす
      await this.handleVacCreate(newState);
      await this.handleVacDelete(oldState);
    } catch (error) {
      logger.error(tDefault("system:vac.voice_state_update_failed"), error);
    }
  }

  /**
   * channelDelete 時に VAC 設定と管理対象チャンネル情報を同期する
   */
  async handleChannelDelete(channel: Channel): Promise<void> {
    try {
      // DM チャンネル削除は対象外
      if (channel.isDMBased()) {
        return;
      }

      // VoiceChannel 以外の削除は VAC 同期対象外
      if (channel.type !== ChannelType.GuildVoice) {
        return;
      }

      // 現在の VAC 設定を読み込み、トリガー/生成済み情報を同期
      const config = await this.vacRepository.getVacConfigOrDefault(
        channel.guildId,
      );

      if (config.triggerChannelIds.includes(channel.id)) {
        // 削除イベントを単一の真実源に同期し、孤立トリガーを残さない
        // トリガー実体が消えた時点で設定側も必ず除去する
        await this.vacRepository.removeTriggerChannel(
          channel.guildId,
          channel.id,
        );
        logger.info(
          tDefault("system:vac.trigger_removed_by_delete", {
            guildId: channel.guildId,
            channelId: channel.id,
          }),
        );
      }

      const isManagedChannel = config.createdChannels.some(
        (item) => item.voiceChannelId === channel.id,
      );
      if (isManagedChannel) {
        // 実体削除時に createdChannels も同時に掃除する
        await this.vacRepository.removeCreatedVacChannel(
          channel.guildId,
          channel.id,
        );
      }
    } catch (error) {
      logger.error(tDefault("system:vac.channel_delete_sync_failed"), error);
    }
  }

  /**
   * Bot 起動時に VAC 設定と実チャンネル状態の不整合を解消する
   */
  async cleanupOnStartup(client: BotClient): Promise<void> {
    try {
      // 参加中ギルドごとに VAC 設定整合性を走査
      // 起動時に1回だけ実行し、平常時のハンドラ負荷を軽減する
      for (const [, guild] of client.guilds.cache) {
        const vacConfig = await this.vacRepository.getVacConfigOrDefault(
          guild.id,
        );

        // 消失/種別不一致のトリガーVCを設定から除去
        for (const triggerChannelId of vacConfig.triggerChannelIds) {
          const triggerChannel = await guild.channels
            .fetch(triggerChannelId)
            .catch(() => null);

          if (
            !triggerChannel ||
            triggerChannel.type !== ChannelType.GuildVoice
          ) {
            await this.vacRepository.removeTriggerChannel(
              guild.id,
              triggerChannelId,
            );
          }
        }

        // 生成済みVCの実体確認と不要エントリ掃除
        for (const channelInfo of vacConfig.createdChannels) {
          const channel = await guild.channels
            .fetch(channelInfo.voiceChannelId)
            .catch(() => null);

          if (!channel) {
            await this.vacRepository.removeCreatedVacChannel(
              guild.id,
              channelInfo.voiceChannelId,
            );
            continue;
          }

          if (channel.isDMBased() || channel.type !== ChannelType.GuildVoice) {
            await this.vacRepository.removeCreatedVacChannel(
              guild.id,
              channelInfo.voiceChannelId,
            );
            continue;
          }

          // 空の管理対象VCは削除して設定も掃除
          if (channel.members.size === 0) {
            await channel.delete().catch(() => null);
            await this.vacRepository.removeCreatedVacChannel(
              guild.id,
              channelInfo.voiceChannelId,
            );
          }
        }
      }
    } catch (error) {
      logger.error(tDefault("system:vac.startup_cleanup_failed"), error);
    }
  }

  /**
   * VAC トリガー入室時に専用VCを生成してメンバーを移動する
   */
  private async handleVacCreate(newState: VoiceState): Promise<void> {
    // 入室イベントに必要な要素（member / voice channel）を検証
    const member = newState.member;
    const newChannel = newState.channel;
    if (!member || !newChannel || newChannel.type !== ChannelType.GuildVoice) {
      return;
    }

    // VAC 有効 + トリガーVC一致時のみ生成フローへ進む
    const config = await this.vacRepository.getVacConfigOrDefault(
      member.guild.id,
    );
    if (!config.enabled || !config.triggerChannelIds.includes(newChannel.id)) {
      return;
    }
    // 無効化中または非トリガー入室は一切副作用を起こさない

    // 同オーナーVCが既存なら再利用（孤立レコードは除去）
    const existingOwnedChannel = config.createdChannels.find(
      (channel) => channel.ownerId === member.id,
    );
    if (existingOwnedChannel) {
      const ownedChannel = await member.guild.channels
        .fetch(existingOwnedChannel.voiceChannelId)
        .catch(() => null);
      if (ownedChannel?.type === ChannelType.GuildVoice) {
        await member.voice.setChannel(ownedChannel);
        return;
      }
      await this.vacRepository.removeCreatedVacChannel(
        member.guild.id,
        existingOwnedChannel.voiceChannelId,
      );
      // 孤立レコードを除去したうえで新規作成フローへ継続
    }

    // 親カテゴリのチャンネル数上限を超える場合は作成しない
    const parentCategory =
      newChannel.parent?.type === ChannelType.GuildCategory
        ? newChannel.parent
        : null;

    if (
      parentCategory &&
      parentCategory.children.cache.size >= VAC_EVENT.CATEGORY_CHANNEL_LIMIT
    ) {
      // Discord 側の上限に達したカテゴリでは作成を試みない
      logger.warn(
        tDefault("system:vac.category_full", {
          guildId: member.guild.id,
          categoryId: parentCategory.id,
        }),
      );
      return;
    }

    // 一意名でVCを作成し、操作パネル送信と移動を実施
    const channelName = buildUniqueChannelName(
      member,
      member.guild.channels.cache,
    );
    const voiceChannel = await member.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: parentCategory?.id ?? null,
      userLimit: VAC_EVENT.DEFAULT_LIMIT,
      permissionOverwrites: [
        {
          id: member.id,
          allow: [PermissionFlagsBits.ManageChannels],
        },
      ],
    });
    // 作成直後の型を再確認し、想定外型では後続処理に進まない

    if (voiceChannel.type !== ChannelType.GuildVoice) {
      return;
    }

    await sendVacControlPanel(voiceChannel).catch((error) => {
      // パネル送信失敗でもVC生成自体は継続（最低限の動作を優先）
      // 操作UI欠落はログ観測で補足し、作成済みVCは有効扱いとする
      logger.error(tDefault("system:vac.panel_send_failed"), error);
    });

    await member.voice.setChannel(voiceChannel);

    // 生成済みVCとして永続化
    await this.vacRepository.addCreatedVacChannel(member.guild.id, {
      voiceChannelId: voiceChannel.id,
      ownerId: member.id,
      createdAt: Date.now(),
    });

    logger.info(
      tDefault("system:vac.channel_created", {
        guildId: member.guild.id,
        channelId: voiceChannel.id,
        ownerId: member.id,
      }),
    );
  }

  /**
   * VAC 管理対象VCが空になった際に削除と設定クリーンアップを行う
   */
  private async handleVacDelete(oldState: VoiceState): Promise<void> {
    // 退室元が VoiceChannel でない場合は対象外
    const oldChannel = oldState.channel;
    if (!oldChannel || oldChannel.type !== ChannelType.GuildVoice) {
      return;
    }

    // 管理対象かつ空室になった VC のみ削除対象
    const config = await this.vacRepository.getVacConfigOrDefault(
      oldChannel.guild.id,
    );
    const isManaged = config.createdChannels.some(
      (channel) => channel.voiceChannelId === oldChannel.id,
    );

    if (!isManaged || oldChannel.members.size > 0) {
      // 管理外または在室中チャンネルは削除しない
      return;
    }

    // 空になった管理VCを削除し、設定情報も同期
    await oldChannel.delete().catch(() => null);
    await this.vacRepository.removeCreatedVacChannel(
      oldChannel.guild.id,
      oldChannel.id,
    );

    logger.info(
      tDefault("system:vac.channel_deleted", {
        guildId: oldChannel.guild.id,
        channelId: oldChannel.id,
      }),
    );
  }
}

/**
 * 既存チャンネル名と衝突しない VAC チャンネル名を生成する関数
 */
function buildUniqueChannelName(
  member: GuildMember,
  channels: GuildChannelsCache,
): string {
  // displayName ベースで既存名と衝突しない連番名を生成
  const baseName = `${member.displayName}'s Room`;
  let channelName = baseName;
  let counter = 2;

  while (channels.find((channel) => channel.name === channelName)) {
    channelName = `${baseName} (${counter})`;
    counter += 1;
  }

  return channelName;
}

let vacService: VacService | undefined;
let cachedRepository: IVacRepository | undefined;

/**
 * VAC サービスのシングルトンを取得する
 */
export function getVacService(repository?: IVacRepository): VacService {
  // テスト時は注入リポジトリ、本番は既定リポジトリを解決
  const resolvedRepository = getVacRepository(repository);
  // 依存リポジトリが変わった場合はサービスを再生成
  if (!vacService || cachedRepository !== resolvedRepository) {
    vacService = new VacService(resolvedRepository);
    cachedRepository = resolvedRepository;
  }
  // 現在有効なシングルトンを返す
  return vacService;
}
