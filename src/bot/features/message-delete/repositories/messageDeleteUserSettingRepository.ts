// src/bot/features/message-delete/repositories/messageDeleteUserSettingRepository.ts
// メッセージ削除ユーザー設定リポジトリ（Prisma実装）

import type { PrismaClient } from "@prisma/client";
import type {
  IMessageDeleteUserSettingRepository,
  MessageDeleteUserSetting,
} from "../../../../shared/database/types";
import { tDefault } from "../../../../shared/locale/localeManager";
import { executeWithDatabaseError } from "../../../../shared/utils/errorHandling";

/**
 * Prisma を使用した UserSetting リポジトリ実装
 */
export class MessageDeleteUserSettingRepository implements IMessageDeleteUserSettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * ユーザーIDとギルドIDの複合キーで設定レコードを検索する
   * @param userId 検索対象のユーザーID
   * @param guildId 検索対象のギルドID
   * @returns 設定レコード、存在しない場合は null を示す Promise
   */
  async findByUserAndGuild(
    userId: string,
    guildId: string,
  ): Promise<MessageDeleteUserSetting | null> {
    return executeWithDatabaseError(
      () =>
        this.prisma.messageDeleteUserSetting.findUnique({
          where: { userId_guildId: { userId, guildId } },
        }),
      tDefault("system:database.user_setting_find_failed", { userId, guildId }),
    );
  }

  /**
   * ユーザー設定を作成または更新する（upsert）
   * @param userId 更新対象のユーザーID
   * @param guildId 更新対象のギルドID
   * @param patch 更新するフィールド（skipConfirm）
   * @returns 更新後の設定レコードを示す Promise
   */
  async upsert(
    userId: string,
    guildId: string,
    patch: { skipConfirm: boolean },
  ): Promise<MessageDeleteUserSetting> {
    return executeWithDatabaseError(
      () =>
        this.prisma.messageDeleteUserSetting.upsert({
          where: { userId_guildId: { userId, guildId } },
          create: { userId, guildId, skipConfirm: patch.skipConfirm },
          update: { skipConfirm: patch.skipConfirm },
        }),
      tDefault("system:database.user_setting_upsert_failed", {
        userId,
        guildId,
      }),
    );
  }
}

let cachedRepository: MessageDeleteUserSettingRepository | undefined;

/**
 * MessageDeleteUserSettingRepository のシングルトンを取得する
 * @param prisma Prisma クライアントインスタンス
 * @returns MessageDeleteUserSettingRepository の唯一のインスタンス
 */
export function getMessageDeleteUserSettingRepository(
  prisma: PrismaClient,
): MessageDeleteUserSettingRepository {
  if (!cachedRepository) {
    cachedRepository = new MessageDeleteUserSettingRepository(prisma);
  }
  return cachedRepository;
}
