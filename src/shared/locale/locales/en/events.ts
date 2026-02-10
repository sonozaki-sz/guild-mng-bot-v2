// src/shared/locale/locales/en/events.ts
// Event-related translations (English)

export const events = {
  // Bot startup
  "ready.logged_in": "Logged in as {{username}}",
  "ready.commands_registered": "Registered {{count}} commands",

  // Guild-related
  "guild.joined": "Joined new server: {{guildName}}",
  "guild.left": "Left server: {{guildName}}",

  // Member-related
  "member.joined": "{{username}} joined the server",
  "member.left": "{{username}} left the server",
} as const;

export type EventsTranslations = typeof events;
