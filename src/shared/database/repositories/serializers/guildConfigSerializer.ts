// src/shared/database/repositories/serializers/guildConfigSerializer.ts
// GuildConfig の serializer / deserializer

import type {
  AfkConfig,
  BumpReminderConfig,
  GuildConfig,
  MemberLogConfig,
  StickMessage,
  VacConfig,
} from "../../types";

type GuildConfigRecord = {
  id: string;
  guildId: string;
  locale: string;
  afkConfig: string | null;
  vacConfig: string | null;
  bumpReminderConfig: string | null;
  stickMessages: string | null;
  memberLogConfig: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function stringifyIfDefined(value: unknown): string | null {
  return value !== undefined ? JSON.stringify(value) : null;
}

export function parseJsonSafe<T>(json: string | null): T | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

export function toGuildConfig(record: GuildConfigRecord): GuildConfig {
  return {
    guildId: record.guildId,
    locale: record.locale,
    afkConfig: parseJsonSafe<AfkConfig>(record.afkConfig),
    vacConfig: parseJsonSafe<VacConfig>(record.vacConfig),
    bumpReminderConfig: parseJsonSafe<BumpReminderConfig>(
      record.bumpReminderConfig,
    ),
    stickMessages: parseJsonSafe<StickMessage[]>(record.stickMessages),
    memberLogConfig: parseJsonSafe<MemberLogConfig>(record.memberLogConfig),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toGuildConfigCreateData(
  config: GuildConfig,
  defaultLocale: string,
): {
  guildId: string;
  locale: string;
  afkConfig: string | null;
  vacConfig: string | null;
  bumpReminderConfig: string | null;
  stickMessages: string | null;
  memberLogConfig: string | null;
} {
  return {
    guildId: config.guildId,
    locale: config.locale || defaultLocale,
    afkConfig: stringifyIfDefined(config.afkConfig),
    vacConfig: stringifyIfDefined(config.vacConfig),
    bumpReminderConfig: stringifyIfDefined(config.bumpReminderConfig),
    stickMessages: stringifyIfDefined(config.stickMessages),
    memberLogConfig: stringifyIfDefined(config.memberLogConfig),
  };
}

export function toGuildConfigUpdateData(
  updates: Partial<GuildConfig>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (updates.locale !== undefined) data.locale = updates.locale;
  if (updates.afkConfig !== undefined) {
    data.afkConfig = JSON.stringify(updates.afkConfig);
  }
  if (updates.vacConfig !== undefined) {
    data.vacConfig = JSON.stringify(updates.vacConfig);
  }
  if (updates.bumpReminderConfig !== undefined) {
    data.bumpReminderConfig = JSON.stringify(updates.bumpReminderConfig);
  }
  if (updates.stickMessages !== undefined) {
    data.stickMessages = JSON.stringify(updates.stickMessages);
  }
  if (updates.memberLogConfig !== undefined) {
    data.memberLogConfig = JSON.stringify(updates.memberLogConfig);
  }

  return data;
}
