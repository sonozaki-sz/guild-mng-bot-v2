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
 */
export function getMessageDeleteUserSettingRepository(
  prisma: PrismaClient,
): MessageDeleteUserSettingRepository {
  if (!cachedRepository) {
    cachedRepository = new MessageDeleteUserSettingRepository(prisma);
  }
  return cachedRepository;
}
