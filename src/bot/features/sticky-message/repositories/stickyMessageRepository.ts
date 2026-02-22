// src/bot/features/sticky-message/repositories/stickyMessageRepository.ts
// スティッキーメッセージ用リポジトリ

import type { PrismaClient } from "@prisma/client";
import type {
  IStickyMessageRepository,
  StickyMessage,
} from "../../../../shared/database/types";
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
      "StickyMessageRepository.findByChannel",
    );
  }

  async findAllByGuild(guildId: string): Promise<StickyMessage[]> {
    return executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.findMany({
          where: { guildId },
          orderBy: { createdAt: "asc" },
        }),
      "StickyMessageRepository.findAllByGuild",
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
      "StickyMessageRepository.create",
    );
  }

  async updateLastMessageId(id: string, lastMessageId: string): Promise<void> {
    await executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.update({
          where: { id },
          data: { lastMessageId },
        }),
      "StickyMessageRepository.updateLastMessageId",
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
      "StickyMessageRepository.updateContent",
    );
  }

  async delete(id: string): Promise<void> {
    await executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.delete({
          where: { id },
        }),
      "StickyMessageRepository.delete",
    );
  }

  async deleteByChannel(channelId: string): Promise<void> {
    await executeWithDatabaseError(
      () =>
        this.prisma.stickyMessage.deleteMany({
          where: { channelId },
        }),
      "StickyMessageRepository.deleteByChannel",
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
