// src/shared/database/stores/guildBumpReminderConfigStore.ts
// Bumpリマインダー設定の永続化ストア

import type { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../../errors";
import { tDefault } from "../../locale";
import {
  BUMP_REMINDER_MENTION_CLEAR_RESULT,
  BUMP_REMINDER_MENTION_ROLE_RESULT,
  BUMP_REMINDER_MENTION_USER_ADD_RESULT,
  BUMP_REMINDER_MENTION_USER_MODE,
  BUMP_REMINDER_MENTION_USER_REMOVE_RESULT,
  BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT,
  type BumpReminderConfig,
  type BumpReminderMentionClearResult,
  type BumpReminderMentionRoleResult,
  type BumpReminderMentionUserAddResult,
  type BumpReminderMentionUserMode,
  type BumpReminderMentionUserRemoveResult,
  type BumpReminderMentionUsersClearResult,
} from "../types";

/**
 * Guild単位のBumpリマインダー設定を永続化するストア
 */
export class GuildBumpReminderConfigStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly defaultLocale: string,
    private readonly safeJsonParse: <T>(json: string | null) => T | undefined,
  ) {}

  async getBumpReminderConfig(
    guildId: string,
  ): Promise<BumpReminderConfig | null> {
    // bumpReminderConfig カラムのみ取得して最小クエリ化
    const record = await this.prisma.guildConfig.findUnique({
      where: { guildId },
      select: { bumpReminderConfig: true },
    });
    // JSON を安全にパース（壊れた JSON は undefined）
    const parsed = this.safeJsonParse<BumpReminderConfig>(
      record?.bumpReminderConfig ?? null,
    );

    // 正常に読めた場合は mentionUserIds の形を正規化して返す
    if (parsed) {
      return {
        ...parsed,
        mentionUserIds: Array.isArray(parsed.mentionUserIds)
          ? parsed.mentionUserIds
          : [],
      };
    }

    // 値はあるがパース失敗したケースは null 扱い（呼び出し側で既定値化）
    if (record?.bumpReminderConfig) {
      return null;
    }

    // レコード未設定時は初期状態を返す（enabled: true は現行仕様）
    // 呼び出し側で undefined 分岐を増やさないため初期 shape を返す
    return {
      enabled: true,
      mentionRoleId: undefined,
      mentionUserIds: [],
    };
  }

  async setBumpReminderEnabled(
    guildId: string,
    enabled: boolean,
    channelId?: string,
  ): Promise<void> {
    // 同時更新競合に備え、CAS 方式で最大3回リトライ
    // 一時競合の吸収が目的のため固定回数で打ち切る
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // 試行ごとに最新DB状態を読み、競合後の状態で再計算する
      // 毎リトライで最新値を再読込し、競合解消後の状態で再評価する
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { bumpReminderConfig: true },
      });

      // 現在値を取得し、存在しない場合は初期化ルートへ進む
      const rawConfig = record?.bumpReminderConfig ?? null;
      const config = this.safeJsonParse<BumpReminderConfig>(rawConfig);

      if (!config) {
        // 初期設定を作成して bumpReminderConfig を埋める
        const initialConfig: BumpReminderConfig = {
          enabled,
          channelId,
          mentionRoleId: undefined,
          mentionUserIds: [],
        };
        const initialJson = JSON.stringify(initialConfig);

        // レコードがある場合は null 条件付き updateMany で CAS 初期化
        if (record) {
          // 既存行あり: null 条件付き更新で初期値投入の競合を回避
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              bumpReminderConfig: null,
            },
            data: {
              bumpReminderConfig: initialJson,
            },
          });
          if (initResult.count > 0) {
            // null → 初期値へのCAS初期化が成功
            // 初回投入できた時点で目的達成のため終了する
            return;
          }
          // レコードがない場合は guild 行ごと upsert で作成
        } else {
          // 行自体が無い場合のみ upsert(create) で初回作成
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.defaultLocale,
              bumpReminderConfig: initialJson,
            },
          });
        }
        continue;
      }

      // 配列形状を正規化したうえで更新値を生成
      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];

      const updatedConfig: BumpReminderConfig = {
        ...config,
        enabled,
        channelId: channelId ?? config.channelId,
        mentionUserIds,
      };
      // channelId 未指定時は既存値を維持し、enable/disable 操作で通知先を壊さない

      // 値が変わらない場合は DB 更新を省略
      const updatedJson = JSON.stringify(updatedConfig);
      if (updatedJson === rawConfig) {
        // 書き込む差分がない場合は早期終了
        return;
      }

      // 旧値一致条件で CAS 更新
      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          bumpReminderConfig: rawConfig,
        },
        data: {
          bumpReminderConfig: updatedJson,
        },
      });

      // 競合なく更新できたら終了
      if (result.count > 0) {
        // updateMany の更新件数で CAS 成否を判定
        // count=0 は競合シグナルとして扱い次試行へ進む
        return;
      }

      // CAS 不一致時は他更新が先行した可能性があるため次リトライへ
      // 次ループで最新JSONを再取得して再計算する
    }

    throw new DatabaseError(
      tDefault("errors:database.update_config_failed") +
        `: bump reminder enable update conflict (${guildId})`,
    );
  }

  async updateBumpReminderConfig(
    guildId: string,
    bumpReminderConfig: BumpReminderConfig,
  ): Promise<void> {
    // JSON 全体を置き換える更新も CAS 方式でリトライ
    const maxRetries = 3;
    const nextJson = JSON.stringify(bumpReminderConfig);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // 比較元(JSON)を毎回更新するため再読込してから CAS する
      // 毎リトライで最新値を読み直し、CAS比較元を更新する
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { bumpReminderConfig: true },
      });

      const rawConfig = record?.bumpReminderConfig ?? null;

      // 変更がなければ更新不要
      if (rawConfig === nextJson) {
        // 同値なら CAS 更新は不要
        // 無変更 write を避けて updateMany 競合機会を減らす
        return;
      }

      // 未初期化なら null 条件付き更新または upsert で初期化
      if (rawConfig === null) {
        if (record) {
          // 既存行の未初期化(null)のみを対象に初期投入
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              bumpReminderConfig: null,
            },
            data: {
              bumpReminderConfig: nextJson,
            },
          });
          if (initResult.count > 0) {
            // null 状態からの初期投入が成功
            return;
          }
        } else {
          // 対象 guild の設定行が存在しない場合は新規作成
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.defaultLocale,
              bumpReminderConfig: nextJson,
            },
          });
        }
        continue;
      }

      // 旧値一致条件の CAS 更新
      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          bumpReminderConfig: rawConfig,
        },
        data: {
          bumpReminderConfig: nextJson,
        },
      });

      if (result.count > 0) {
        // 成功時のみ結果を返し、競合時は次試行で再評価する
        return;
      }

      // 競合時は次リトライで再読込して再試行
    }

    throw new DatabaseError(
      tDefault("errors:database.update_config_failed") +
        `: bump reminder config update conflict (${guildId})`,
    );
  }

  async setBumpReminderMentionRole(
    guildId: string,
    roleId: string | undefined,
  ): Promise<BumpReminderMentionRoleResult> {
    // ロール設定変更は共通 mutate ルートへ委譲
    return this.mutateBumpReminderConfig(guildId, (config) => {
      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];

      return {
        result: BUMP_REMINDER_MENTION_ROLE_RESULT.UPDATED,
        updatedConfig: {
          ...config,
          mentionRoleId: roleId,
          mentionUserIds,
        },
      };
    });
  }

  async addBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserAddResult> {
    // 追加専用モードで共通 mutate 処理を呼ぶ
    return this.mutateBumpReminderMentionUsers(
      guildId,
      userId,
      BUMP_REMINDER_MENTION_USER_MODE.ADD,
    ) as Promise<BumpReminderMentionUserAddResult>;
  }

  async removeBumpReminderMentionUser(
    guildId: string,
    userId: string,
  ): Promise<BumpReminderMentionUserRemoveResult> {
    // 削除専用モードで共通 mutate 処理を呼ぶ
    return this.mutateBumpReminderMentionUsers(
      guildId,
      userId,
      BUMP_REMINDER_MENTION_USER_MODE.REMOVE,
    ) as Promise<BumpReminderMentionUserRemoveResult>;
  }

  async clearBumpReminderMentionUsers(
    guildId: string,
  ): Promise<BumpReminderMentionUsersClearResult> {
    // ユーザー配列クリアは共通 mutate ルートへ委譲
    return this.mutateBumpReminderConfig(guildId, (config) => {
      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];

      // 既に空なら書き込みを省略
      if (mentionUserIds.length === 0) {
        return {
          result: BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.ALREADY_EMPTY,
          updatedConfig: {
            ...config,
            mentionUserIds,
          },
          skipWrite: true,
        };
      }

      return {
        result: BUMP_REMINDER_MENTION_USERS_CLEAR_RESULT.CLEARED,
        updatedConfig: {
          ...config,
          mentionUserIds: [],
        },
      };
    });
  }

  async clearBumpReminderMentions(
    guildId: string,
  ): Promise<BumpReminderMentionClearResult> {
    // ロール/ユーザーの双方クリアを共通 mutate で実行
    return this.mutateBumpReminderConfig(guildId, (config) => {
      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];

      // 既に未設定なら書き込みを省略
      if (!config.mentionRoleId && mentionUserIds.length === 0) {
        return {
          result: BUMP_REMINDER_MENTION_CLEAR_RESULT.ALREADY_CLEARED,
          updatedConfig: {
            ...config,
            mentionRoleId: undefined,
            mentionUserIds,
          },
          skipWrite: true,
        };
      }

      return {
        result: BUMP_REMINDER_MENTION_CLEAR_RESULT.CLEARED,
        updatedConfig: {
          ...config,
          mentionRoleId: undefined,
          mentionUserIds: [],
        },
      };
    });
  }

  private async mutateBumpReminderConfig<
    TResult extends
      | BumpReminderMentionRoleResult
      | BumpReminderMentionUsersClearResult
      | BumpReminderMentionClearResult,
  >(
    guildId: string,
    mutator: (config: BumpReminderConfig) => {
      result: TResult;
      updatedConfig: BumpReminderConfig;
      skipWrite?: boolean;
    },
  ): Promise<
    TResult | typeof BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED
  > {
    // 汎用 mutate（role/users/mentions clear）を CAS リトライで実行
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // 現在値を取得して CAS 比較元に使う
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { bumpReminderConfig: true },
      });

      const rawConfig = record?.bumpReminderConfig ?? null;
      const config = this.safeJsonParse<BumpReminderConfig>(rawConfig);
      // 未初期化時は初期設定を注入し、次ループで mutator を再評価
      if (!config) {
        if (rawConfig !== null) {
          // JSON破損などで読めない場合は未構成扱いで呼び出し側へ返す
          return BUMP_REMINDER_MENTION_ROLE_RESULT.NOT_CONFIGURED;
        }

        const initialConfig: BumpReminderConfig = {
          enabled: true,
          mentionRoleId: undefined,
          mentionUserIds: [],
        };
        const initialJson = JSON.stringify(initialConfig);

        if (record) {
          // 既存行あり: null 条件付き更新で初期化競合を回避
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              bumpReminderConfig: null,
            },
            data: {
              bumpReminderConfig: initialJson,
            },
          });

          if (initResult.count > 0) {
            continue;
          }
        } else {
          // 行自体がない場合は guildConfig を新規作成
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.defaultLocale,
              bumpReminderConfig: initialJson,
            },
          });
          continue;
        }

        continue;
      }

      // mutator が skipWrite を返した場合は結果のみ返す
      const mutation = mutator(config);
      if (mutation.skipWrite) {
        // 変更不要ケースは DB 書き込みを行わず結果だけ返す
        // read-modify-write を省略して競合確率と負荷を下げる
        return mutation.result;
      }

      // CAS 更新で反映
      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          bumpReminderConfig: rawConfig,
        },
        data: {
          bumpReminderConfig: JSON.stringify(mutation.updatedConfig),
        },
      });

      // 競合なく更新できたら結果を返す
      if (result.count > 0) {
        // 競合なく反映できたので即終了
        // mutator の結果種別はこの時点で確定値として返却できる
        return mutation.result;
      }

      // CAS不一致（他トランザクション更新）時はリトライ
    }

    throw new DatabaseError(
      // 最大リトライでも CAS 更新できない場合は競合として失敗
      tDefault("errors:database.update_config_failed") +
        `: bump reminder config update conflict (${guildId})`,
    );
  }

  private async mutateBumpReminderMentionUsers(
    guildId: string,
    userId: string,
    mode: BumpReminderMentionUserMode,
  ): Promise<
    BumpReminderMentionUserAddResult | BumpReminderMentionUserRemoveResult
  > {
    // ユーザー追加/削除専用 mutate（戻り値型が異なるため分離）
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // 現在値を取得して CAS 比較元に使う
      const record = await this.prisma.guildConfig.findUnique({
        where: { guildId },
        select: { bumpReminderConfig: true },
      });

      const rawConfig = record?.bumpReminderConfig ?? null;
      const config = this.safeJsonParse<BumpReminderConfig>(rawConfig);

      // 未初期化時は初期化して次ループで本処理へ
      if (!config) {
        if (rawConfig !== null) {
          // JSON破損などで読めない場合は未構成扱いで返す
          return BUMP_REMINDER_MENTION_USER_ADD_RESULT.NOT_CONFIGURED;
        }

        const initialConfig: BumpReminderConfig = {
          enabled: true,
          mentionRoleId: undefined,
          mentionUserIds: [],
        };
        const initialJson = JSON.stringify(initialConfig);

        if (record) {
          // 既存行あり: null 条件付き更新で初期値投入
          const initResult = await this.prisma.guildConfig.updateMany({
            where: {
              guildId,
              bumpReminderConfig: null,
            },
            data: {
              bumpReminderConfig: initialJson,
            },
          });

          if (initResult.count > 0) {
            continue;
          }
        } else {
          // 行なし: upsert(create) で初期設定行を作成
          await this.prisma.guildConfig.upsert({
            where: { guildId },
            update: {},
            create: {
              guildId,
              locale: this.defaultLocale,
              bumpReminderConfig: initialJson,
            },
          });
          continue;
        }

        continue;
      }

      // 現在配列を正規化し、存在有無を判定
      const mentionUserIds = Array.isArray(config.mentionUserIds)
        ? config.mentionUserIds
        : [];
      const exists = mentionUserIds.includes(userId);

      if (mode === BUMP_REMINDER_MENTION_USER_MODE.ADD && exists) {
        // 追加要求だが既に存在するため更新不要
        // idempotent に ALREADY_EXISTS を返して上位UIへ委譲
        return BUMP_REMINDER_MENTION_USER_ADD_RESULT.ALREADY_EXISTS;
      }
      if (mode === BUMP_REMINDER_MENTION_USER_MODE.REMOVE && !exists) {
        // 削除要求だが対象が存在しないため更新不要
        // remove も idempotent に NOT_FOUND を返す
        return BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.NOT_FOUND;
      }
      // ここ以降は実際に状態差分があるケースのみ更新を試みる

      // ADD/REMOVE の結果に応じて次配列を生成
      const nextMentionUserIds =
        mode === BUMP_REMINDER_MENTION_USER_MODE.ADD
          ? [...mentionUserIds, userId]
          : mentionUserIds.filter((id) => id !== userId);

      const updatedConfig: BumpReminderConfig = {
        ...config,
        mentionUserIds: nextMentionUserIds,
      };

      // CAS 更新で反映
      const result = await this.prisma.guildConfig.updateMany({
        where: {
          guildId,
          bumpReminderConfig: rawConfig,
        },
        data: {
          bumpReminderConfig: JSON.stringify(updatedConfig),
        },
      });

      if (result.count > 0) {
        // 反映成功時は操作モードに対応する結果を返す
        // ADD/REMOVE の結果コードをここで確定して上位へ返却
        return mode === BUMP_REMINDER_MENTION_USER_MODE.ADD
          ? BUMP_REMINDER_MENTION_USER_ADD_RESULT.ADDED
          : BUMP_REMINDER_MENTION_USER_REMOVE_RESULT.REMOVED;
      }

      // 競合時は最新状態で再計算するため次リトライ
    }

    throw new DatabaseError(
      // 最大リトライでも CAS 更新できない場合は競合として失敗
      tDefault("errors:database.update_config_failed") +
        `: bump reminder mention user update conflict (${guildId})`,
    );
  }
}
