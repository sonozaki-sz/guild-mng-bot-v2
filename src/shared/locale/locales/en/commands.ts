// src/shared/locale/locales/en/commands.ts
// Command-related translations (English)

export const commands = {
  // Ping command
  "ping.description": "Check bot response speed",
  "ping.measuring": "🏓 Measuring...",
  "ping.result":
    "🏓 Pong!\n📡 API Latency: **{{apiLatency}}ms**\n💓 WebSocket Ping: **{{wsLatency}}ms**",

  // Common messages
  "cooldown.wait": "⏱️ You can use this command in **{{seconds}} seconds**",

  // AFK command
  "afk.description": "Move user to AFK channel",
  "afk.user.description": "User to move (default: yourself)",
  "afk.moved": "Moved {{user}} to {{channel}}",
  "afk.moved_log":
    "Moved user {{userId}} to {{channelId}} in guild {{guildId}}",

  // AFK config command
  "afk-config.description": "Configure AFK feature (administrators only)",
  "afk-config.set-ch.description": "Configure AFK channel",
  "afk-config.set-ch.channel.description": "AFK channel (voice channel)",
  "afk-config.show.description": "Show current settings",
  "afk.configured": "AFK channel configured: {{channel}}",
  "afk.not_configured": "AFK channel is not configured",
  "afk.settings_title": "**AFK Settings**",
  "afk.configured_log":
    "AFK channel configured for guild {{guildId}}, channel {{channelId}}",
} as const;

export type CommandsTranslations = typeof commands;
