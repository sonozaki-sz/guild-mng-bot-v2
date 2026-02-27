// src/bot/features/sticky-message/repositories/stickyMessageRepository.ts
// スティッキーメッセージ用リポジトリ

import type { PrismaClient } from "@prisma/client";
import type {
  IStickyMessageRepository,
  StickyMessage,
} from "../../../../shared/database/types";
import { tDefault } from "../../../../shared/locale/localeManager";
import { executeWithDatabaseError } from "../../../../shared/utils/errorHandling";

/**
 * Prisma 実装
 */
export class StickyMessageRepository implements IStickyMessageRepository {
  constructor(private prisma: PrismaClient) {}

  async findByChannel(channelId: string): Promise<StickyMessage | null> {
    return executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.findUnique({
          where: { channelId },
        }),
      tDefault("system:database.sticky_message_find_by_channel_failed", {
        channelId,
      }),
    );
  }

  async findAllByGuild(guildId: string): Promise<StickyMessage[]> {
    return executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.findMany({
          where: { guildId },
          orderBy: { createdAt: "asc" },
        }),
      tDefault("system:database.sticky_message_find_all_by_guild_failed", {
        guildId,
      }),
    );
  }

  async create(
    guildId: string,
    channelId: string,
    content: string,
    embedData?: string,
    updatedBy?: string,
  ): Promise<StickyMessage> {
    return executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.create({
          data: {
            guildId,
            channelId,
            content,
            embedData: embedData ?? null,
            updatedBy: updatedBy ?? null,
          },
        }),
      tDefault("system:database.sticky_message_create_failed", {
        guildId,
        channelId,
      }),
    );
  }

  async updateLastMessageId(id: string, lastMessageId: string): Promise<void> {
    await executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.update({
          where: { id },
          data: { lastMessageId },
        }),
      tDefault("system:database.sticky_message_update_last_message_id_failed", {
        id,
      }),
    );
  }

  async updateContent(
    id: string,
    content: string,
    embedData: string | null,
    updatedBy?: string,
  ): Promise<StickyMessage> {
    return executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.update({
          where: { id },
          data: {
            content,
            embedData,
            lastMessageId: null,
            ...(updatedBy !== undefined && { updatedBy }),
          },
        }),
      tDefault("system:database.sticky_message_update_content_failed", { id }),
    );
  }

  async delete(id: string): Promise<void> {
    await executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.delete({
          where: { id },
        }),
      tDefault("system:database.sticky_message_delete_failed", { id }),
    );
  }

  async deleteByChannel(channelId: string): Promise<void> {
    await executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.deleteMany({
          where: { channelId },
        }),
      tDefault("system:database.sticky_message_delete_by_channel_failed", {
        channelId,
      }),
    );
  }
}

let repository: IStickyMessageRepository | undefined;

/**
 * Prisma 実装のリポジトリを生成 / 取得する
 */
export function getStickyMessageRepository(
  prisma?: PrismaClient,
): IStickyMessageRepository {
  if (!repository) {
    if (!prisma) {
      throw new Error(
        "StickyMessageRepository is not initialized. Provide PrismaClient on first call.",
      );
    }
    repository = new StickyMessageRepository(prisma);
  }
  return repository;
}
